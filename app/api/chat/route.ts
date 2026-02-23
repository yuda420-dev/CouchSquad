import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { COACHES } from "@/lib/coaches/catalog";
import { buildCoachPrompt } from "@/lib/ai/prompt-builder";
import { streamChat, type ChatMessage } from "@/lib/ai/providers";
import { saveMessagePair } from "@/lib/supabase/conversations";
import { loadMemories, processConversationMemory } from "@/lib/ai/memory";
import { trackMessageSent } from "@/lib/analytics/track";
import type { Coach, PersonalityTraits } from "@/lib/supabase/types";

/** Helper to create Supabase client for API routes */
async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore
          }
        },
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    const { coachId, message, history = [], conversationId } = await request.json();

    if (!coachId || !message) {
      return new Response(JSON.stringify({ error: "Missing coachId or message" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const coaches = COACHES as unknown as Coach[];
    const coach = coaches.find((c) => c.id === coachId);
    if (!coach) {
      return new Response(JSON.stringify({ error: "Coach not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Try to load memories and personality overrides for authenticated users
    let memories: Awaited<ReturnType<typeof loadMemories>> = [];
    let personalityOverrides: Partial<PersonalityTraits> = {};
    let userId: string | null = null;

    try {
      const supabase = await getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        // Load memories and personality settings in parallel
        const [mems, settingsRes] = await Promise.all([
          loadMemories(supabase, user.id, coachId),
          supabase
            .from("user_coach_settings")
            .select("personality_overrides")
            .eq("user_id", user.id)
            .eq("coach_id", coachId)
            .single(),
        ]);
        memories = mems;
        if (settingsRes.data?.personality_overrides) {
          personalityOverrides = settingsRes.data.personality_overrides;
        }
      }
    } catch {
      // Non-critical — continue without memories/overrides
    }

    // Build system prompt WITH memories and personality overrides
    const systemPrompt = buildCoachPrompt(coach, personalityOverrides, memories, false);

    // Prepare messages
    const messages: ChatMessage[] = [
      ...history.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: message },
    ];

    // Stream the response
    const aiStream = await streamChat(
      coach.ai_provider,
      coach.ai_model,
      systemPrompt,
      messages
    );

    // Wrap the stream to capture the full response for persistence + memory
    let fullAssistantContent = "";
    const decoder = new TextDecoder();

    const persistingStream = new ReadableStream({
      async start(controller) {
        const reader = aiStream.getReader();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            controller.enqueue(value);

            // Capture text for persistence
            const text = decoder.decode(value, { stream: true });
            const lines = text.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === "text") {
                    fullAssistantContent += data.text;
                  }
                } catch {
                  // Skip malformed JSON
                }
              }
            }
          }

          controller.close();
        } catch (err) {
          controller.error(err);
        } finally {
          // After streaming completes, persist + extract memory (fire-and-forget)
          if (fullAssistantContent) {
            postStreamProcessing(
              conversationId,
              userId,
              coach,
              message,
              fullAssistantContent
            ).catch((err) => console.error("Post-stream processing error:", err));
          }
        }
      },
    });

    return new Response(persistingStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * After streaming completes:
 * 1. Save the message pair to the database
 * 2. Extract and store memory facts
 */
async function postStreamProcessing(
  conversationId: string | undefined,
  userId: string | null,
  coach: Coach,
  userMessage: string,
  assistantMessage: string
) {
  try {
    const supabase = await getSupabase();

    // 1. Persist messages (encrypted at rest)
    if (conversationId) {
      await saveMessagePair(supabase, conversationId, userMessage, assistantMessage, {
        coach_id: coach.id,
        ai_provider: coach.ai_provider,
        ai_model: coach.ai_model,
      }, userId || undefined);
    }

    // 2. Track anonymous analytics (no user_id, no content)
    trackMessageSent(coach.id, coach.domain);

    // 3. Extract and store memory facts
    if (userId) {
      await processConversationMemory(
        supabase,
        userId,
        coach.id,
        coach.domain,
        userMessage,
        assistantMessage
      );
    }
  } catch (err) {
    console.error("postStreamProcessing error:", err);
  }
}

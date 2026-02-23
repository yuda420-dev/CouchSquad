import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

/**
 * POST /api/session-notes
 * Generate a session summary from the last messages of a conversation.
 *
 * Body: { conversationId: string }
 *
 * Returns an AI-generated 2-3 line summary of the session.
 * This is like a real coach's session notes — a quick recap of what was discussed.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await request.json();
    if (!conversationId) {
      return Response.json({ error: "conversationId required" }, { status: 400 });
    }

    // Get last 10 messages from the conversation
    const { data: messages } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!messages || messages.length === 0) {
      return Response.json({ note: null });
    }

    // Build a transcript
    const transcript = messages
      .reverse()
      .map((m) => `${m.role === "user" ? "Client" : "Coach"}: ${m.content.slice(0, 200)}`)
      .join("\n");

    // Generate summary using OpenAI (cheap/fast model)
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Fallback: create a simple extractive summary
      const lastCoachMsg = messages.filter((m) => m.role === "assistant").pop();
      const lastUserMsg = messages.filter((m) => m.role === "user").pop();
      const note = `Client discussed: ${lastUserMsg?.content.slice(0, 80) || "various topics"}. Key focus area this session.`;
      return Response.json({ note });
    }

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are writing brief session notes as a professional coach. Write 2-3 concise sentences summarizing this coaching session. Focus on: what the client discussed, key insights or strategies shared, and any action items or next steps. Write in third person. Be professional but warm.",
          },
          {
            role: "user",
            content: `Write session notes for this coaching conversation:\n\n${transcript}`,
          },
        ],
        max_tokens: 150,
        temperature: 0.3,
      }),
    });

    if (!aiRes.ok) {
      return Response.json({ note: null });
    }

    const aiData = await aiRes.json();
    const note = aiData.choices?.[0]?.message?.content || null;

    return Response.json({ note });
  } catch (error) {
    console.error("Session notes error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

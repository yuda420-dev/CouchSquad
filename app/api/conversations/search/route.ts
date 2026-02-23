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
 * GET /api/conversations/search?q=term&coachId=xxx
 * Search across all conversations and messages for a user.
 * Returns matching messages with conversation context.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();
    const coachId = searchParams.get("coachId");

    if (!query || query.length < 2) {
      return Response.json({ results: [] });
    }

    // Get user's conversations first
    let convoQuery = supabase
      .from("conversations")
      .select("id, coach_id, conversation_type, started_at")
      .eq("user_id", user.id);

    if (coachId) {
      convoQuery = convoQuery.eq("coach_id", coachId);
    }

    const { data: conversations } = await convoQuery;
    if (!conversations?.length) {
      return Response.json({ results: [] });
    }

    const convoIds = conversations.map((c) => c.id);
    const convoMap = new Map(conversations.map((c) => [c.id, c]));

    // Search messages using ilike (case-insensitive pattern match)
    const { data: messages, error } = await supabase
      .from("messages")
      .select("id, conversation_id, role, content, created_at")
      .in("conversation_id", convoIds)
      .ilike("content", `%${query}%`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Search error:", error);
      return Response.json({ results: [] });
    }

    // Build results with context
    const results = (messages || []).map((msg) => {
      const convo = convoMap.get(msg.conversation_id);
      return {
        message_id: msg.id,
        conversation_id: msg.conversation_id,
        coach_id: convo?.coach_id || "",
        role: msg.role,
        content: msg.content,
        created_at: msg.created_at,
        conversation_type: convo?.conversation_type || "chat",
      };
    });

    return Response.json({ results });
  } catch (error) {
    console.error("Search API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
 * GET /api/reactions?conversationId=xxx
 * Load all reactions for a conversation.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversationId = request.nextUrl.searchParams.get("conversationId");
    if (!conversationId) {
      return Response.json({ error: "Missing conversationId" }, { status: 400 });
    }

    const { data } = await supabase
      .from("message_reactions")
      .select("message_id, emoji")
      .eq("user_id", user.id)
      .eq("conversation_id", conversationId);

    // Group by message_id
    const reactions: Record<string, string[]> = {};
    for (const r of data || []) {
      if (!reactions[r.message_id]) reactions[r.message_id] = [];
      reactions[r.message_id].push(r.emoji);
    }

    return Response.json({ reactions });
  } catch (error) {
    console.error("Reactions GET error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/reactions
 * Add or remove a reaction.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, messageId, conversationId, emoji } = body;

    if (!messageId || !conversationId || !emoji) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    if (action === "add") {
      await supabase.from("message_reactions").upsert(
        {
          user_id: user.id,
          message_id: messageId,
          conversation_id: conversationId,
          emoji,
        },
        {
          onConflict: "user_id,message_id,emoji",
        }
      );
      return Response.json({ ok: true });
    } else if (action === "remove") {
      await supabase
        .from("message_reactions")
        .delete()
        .eq("user_id", user.id)
        .eq("message_id", messageId)
        .eq("emoji", emoji);
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Reactions POST error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

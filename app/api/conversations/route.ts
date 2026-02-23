import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  getOrCreateConversation,
  loadMessages,
  listConversations,
} from "@/lib/supabase/conversations";

/** Helper to create an authenticated Supabase client for API routes */
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
            // Called from route handler — ignore
          }
        },
      },
    }
  );
}

/**
 * GET /api/conversations
 *
 * Query params:
 *   coachId — filter by coach (optional)
 *   conversationId — load a specific conversation with messages
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const coachId = searchParams.get("coachId");
    const conversationId = searchParams.get("conversationId");

    // Load specific conversation with messages
    if (conversationId) {
      const messages = await loadMessages(supabase, conversationId);
      return Response.json({ messages });
    }

    // List conversations (optionally filtered by coach)
    const conversations = await listConversations(
      supabase,
      user.id,
      coachId || undefined
    );

    return Response.json({ conversations });
  } catch (error) {
    console.error("Conversations API error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/conversations
 *
 * Body: { coachId, type? }
 * Returns: { conversation, isNew }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { coachId, type = "chat" } = await request.json();

    if (!coachId) {
      return Response.json({ error: "Missing coachId" }, { status: 400 });
    }

    const result = await getOrCreateConversation(supabase, user.id, coachId, type);
    return Response.json(result);
  } catch (error) {
    console.error("Create conversation error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

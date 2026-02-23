import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { tryDecrypt } from "@/lib/crypto/encryption";

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
 * GET /api/export
 * Export all user data as JSON (conversations, memories, goals, journal, activity).
 */
export async function GET() {
  try {
    const supabase = await getSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Load all user data in parallel
    const [
      conversationsRes,
      messagesRes,
      memoriesRes,
      goalsRes,
      journalRes,
      moodRes,
      touchpointsRes,
      bookmarksRes,
      activityRes,
    ] = await Promise.all([
      supabase
        .from("conversations")
        .select("*")
        .eq("user_id", user.id),
      supabase
        .from("messages")
        .select("*")
        .in(
          "conversation_id",
          (
            await supabase
              .from("conversations")
              .select("id")
              .eq("user_id", user.id)
          ).data?.map((c: { id: string }) => c.id) || []
        )
        .order("created_at", { ascending: true }),
      supabase
        .from("coach_memory")
        .select("*")
        .eq("user_id", user.id),
      supabase
        .from("goals")
        .select("*, milestones(*)")
        .eq("user_id", user.id),
      supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("mood_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("touchpoints")
        .select("*")
        .eq("user_id", user.id),
      supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", user.id),
      supabase
        .from("activity_logs")
        .select("*")
        .eq("user_id", user.id),
    ]);

    // Decrypt encrypted fields before export
    const uid = user.id;
    const decryptField = (row: Record<string, unknown>, field: string) => {
      if (row.encrypted && typeof row[field] === "string") {
        return { ...row, [field]: tryDecrypt(row[field] as string, uid) };
      }
      return row;
    };

    const messages = (messagesRes.data || []).map((m: Record<string, unknown>) => decryptField(m, "content"));
    const memories = (memoriesRes.data || []).map((m: Record<string, unknown>) => decryptField(m, "fact"));
    const journal = (journalRes.data || []).map((j: Record<string, unknown>) => decryptField(j, "content"));

    return Response.json({
      exportedAt: new Date().toISOString(),
      userId: user.id,
      email: user.email,
      conversations: conversationsRes.data || [],
      messages,
      memories,
      goals: goalsRes.data || [],
      journal,
      moods: moodRes.data || [],
      touchpoints: touchpointsRes.data || [],
      bookmarks: bookmarksRes.data || [],
      activityLogs: activityRes.data || [],
    });
  } catch (error) {
    console.error("Export API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

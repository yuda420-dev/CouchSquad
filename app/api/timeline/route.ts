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

export interface TimelineEvent {
  id: string;
  type: "conversation" | "goal_created" | "goal_completed" | "milestone" | "journal" | "mood" | "roster_add" | "intake";
  title: string;
  description: string;
  coach_id: string | null;
  date: string;
  metadata?: Record<string, unknown>;
}

/**
 * GET /api/timeline
 * Merge events from multiple sources into a chronological timeline.
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const events: TimelineEvent[] = [];

    // Run all queries in parallel
    const [conversationsRes, goalsRes, journalRes, moodRes, rosterRes] = await Promise.all([
      supabase
        .from("conversations")
        .select("id, coach_id, conversation_type, title, started_at, message_count")
        .eq("user_id", user.id)
        .gt("message_count", 0)
        .order("started_at", { ascending: false })
        .limit(50),
      supabase
        .from("goals")
        .select("id, coach_id, title, status, progress, domain, created_at, updated_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("journal_entries")
        .select("id, content, mood, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("mood_entries")
        .select("id, mood, energy, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("user_roster")
        .select("id, coach_id, added_at, intake_completed")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("added_at", { ascending: false }),
    ]);

    // Process conversations
    for (const conv of conversationsRes.data || []) {
      const typeLabel = conv.conversation_type === "intake" ? "Intake" : conv.conversation_type === "voice" ? "Voice" : "Chat";
      events.push({
        id: `conv-${conv.id}`,
        type: conv.conversation_type === "intake" ? "intake" : "conversation",
        title: conv.title || `${typeLabel} session`,
        description: `${conv.message_count} messages`,
        coach_id: conv.coach_id,
        date: conv.started_at,
        metadata: { type: conv.conversation_type },
      });
    }

    // Process goals
    for (const goal of goalsRes.data || []) {
      events.push({
        id: `goal-created-${goal.id}`,
        type: "goal_created",
        title: `New goal: ${goal.title}`,
        description: goal.domain,
        coach_id: goal.coach_id,
        date: goal.created_at,
        metadata: { progress: goal.progress, status: goal.status },
      });

      if (goal.status === "completed" && goal.updated_at) {
        events.push({
          id: `goal-completed-${goal.id}`,
          type: "goal_completed",
          title: `Completed: ${goal.title}`,
          description: goal.domain,
          coach_id: goal.coach_id,
          date: goal.updated_at,
        });
      }
    }

    // Process journal entries
    for (const entry of journalRes.data || []) {
      events.push({
        id: `journal-${entry.id}`,
        type: "journal",
        title: "Journal entry",
        description: entry.content.slice(0, 120) + (entry.content.length > 120 ? "..." : ""),
        coach_id: null,
        date: entry.created_at,
        metadata: { mood: entry.mood },
      });
    }

    // Process roster additions
    for (const r of rosterRes.data || []) {
      events.push({
        id: `roster-${r.id}`,
        type: "roster_add",
        title: "Added coach to squad",
        description: r.intake_completed ? "Intake completed" : "Ready to start",
        coach_id: r.coach_id,
        date: r.added_at,
      });
    }

    // Sort chronologically (newest first)
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return Response.json({ events: events.slice(0, 100) });
  } catch (error) {
    console.error("Timeline API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

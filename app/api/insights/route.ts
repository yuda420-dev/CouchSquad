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
 * GET /api/insights
 * Aggregated dashboard data — sessions, hours, streaks, goals, mood, per-coach activity
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Run all queries in parallel
    const [
      conversationsRes,
      messagesRes,
      goalsRes,
      journalRes,
      moodRes,
      rosterRes,
    ] = await Promise.all([
      // Total conversations
      supabase
        .from("conversations")
        .select("id, coach_id, started_at, message_count, conversation_type")
        .eq("user_id", user.id),

      // Total messages (for estimating hours)
      supabase
        .from("messages")
        .select("id, conversation_id, created_at, role")
        .eq("role", "assistant")
        .limit(500),

      // Goals summary
      supabase
        .from("goals")
        .select("id, coach_id, status, progress, domain")
        .eq("user_id", user.id),

      // Journal entries (recent)
      supabase
        .from("journal_entries")
        .select("id, created_at, mood")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100),

      // Mood entries (last 30 days for chart)
      supabase
        .from("mood_entries")
        .select("mood, energy, created_at")
        .eq("user_id", user.id)
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: true }),

      // Roster for per-coach breakdown
      supabase
        .from("user_roster")
        .select("coach_id, added_at, intake_completed, last_interaction")
        .eq("user_id", user.id)
        .eq("is_active", true),
    ]);

    const conversations = conversationsRes.data || [];
    const messages = messagesRes.data || [];
    const goals = goalsRes.data || [];
    const journal = journalRes.data || [];
    const moods = moodRes.data || [];
    const roster = rosterRes.data || [];

    // --- Compute stats ---

    // Total sessions = unique conversations with messages
    const totalSessions = conversations.filter((c) => c.message_count > 0).length;

    // Estimated hours (rough: ~2 min per AI response)
    const totalMessages = messages.length;
    const hoursCoached = Math.round((totalMessages * 2) / 60 * 10) / 10; // Round to 1 decimal

    // Journal streak
    let streak = 0;
    if (journal.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const entryDates = new Set(
        journal.map((e) => {
          const d = new Date(e.created_at);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        })
      );
      let checkDate = new Date(today);
      if (!entryDates.has(checkDate.getTime())) {
        checkDate.setDate(checkDate.getDate() - 1);
      }
      while (entryDates.has(checkDate.getTime())) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    // Goals stats
    const activeGoals = goals.filter((g) => g.status === "active").length;
    const completedGoals = goals.filter((g) => g.status === "completed").length;
    const avgGoalProgress = goals.filter((g) => g.status === "active").length
      ? Math.round(
          goals.filter((g) => g.status === "active").reduce((s, g) => s + g.progress, 0) /
            goals.filter((g) => g.status === "active").length
        )
      : 0;

    // Per-coach activity
    const coachActivity = roster.map((r) => {
      const coachConvos = conversations.filter((c) => c.coach_id === r.coach_id);
      const sessionCount = coachConvos.filter((c) => c.message_count > 0).length;
      const lastActive = coachConvos
        .map((c) => c.started_at)
        .sort()
        .reverse()[0] || r.added_at;
      const coachGoals = goals.filter((g) => g.coach_id === r.coach_id);

      return {
        coach_id: r.coach_id,
        sessions: sessionCount,
        intake_completed: r.intake_completed,
        last_active: lastActive,
        goals_active: coachGoals.filter((g) => g.status === "active").length,
        goals_completed: coachGoals.filter((g) => g.status === "completed").length,
      };
    });

    // Mood trend (last 30 days, mapped to numbers)
    const moodMap: Record<string, number> = {
      great: 5,
      good: 4,
      okay: 3,
      low: 2,
      bad: 1,
    };
    const moodTrend = moods.map((m) => ({
      date: m.created_at,
      value: moodMap[m.mood] || 3,
      mood: m.mood,
      energy: m.energy,
    }));

    // Weekly activity (conversations started per day, last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekAgo);
      d.setDate(d.getDate() + i + 1);
      const dayStr = d.toISOString().slice(0, 10);
      const count = conversations.filter(
        (c) => c.started_at && c.started_at.startsWith(dayStr) && c.message_count > 0
      ).length;
      return { date: dayStr, count };
    });

    return Response.json({
      stats: {
        totalSessions,
        hoursCoached,
        streak,
        coachesActive: roster.length,
        activeGoals,
        completedGoals,
        avgGoalProgress,
        journalEntries: journal.length,
      },
      coachActivity,
      moodTrend,
      weeklyActivity,
    });
  } catch (error) {
    console.error("Insights API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

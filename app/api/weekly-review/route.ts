import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { COACHES } from "@/lib/coaches/catalog";
import type { Coach } from "@/lib/supabase/types";

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
 * GET /api/weekly-review
 *
 * Generates a "State of You" weekly summary:
 * - Sessions this week vs last week
 * - Mood trajectory
 * - Goal progress deltas
 * - Most active coach
 * - Memorable moments (from coach memories)
 * - Journal highlights
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

    const coaches = COACHES as unknown as Coach[];
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [convosRes, moodRes, goalsRes, memoriesRes, journalRes, activityRes] =
      await Promise.all([
        supabase
          .from("conversations")
          .select("coach_id, started_at, message_count")
          .eq("user_id", user.id)
          .gt("message_count", 0)
          .gte("started_at", twoWeeksAgo.toISOString())
          .order("started_at", { ascending: false }),
        supabase
          .from("mood_entries")
          .select("mood, created_at")
          .eq("user_id", user.id)
          .gte("created_at", weekAgo.toISOString())
          .order("created_at", { ascending: true }),
        supabase
          .from("goals")
          .select("coach_id, title, status, progress, updated_at")
          .eq("user_id", user.id)
          .in("status", ["active", "completed"]),
        supabase
          .from("coach_memory")
          .select("coach_id, fact, category, created_at")
          .eq("user_id", user.id)
          .gte("created_at", weekAgo.toISOString())
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("journal_entries")
          .select("title, mood, created_at")
          .eq("user_id", user.id)
          .gte("created_at", weekAgo.toISOString())
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("activity_logs")
          .select("activity_type, title, created_at")
          .eq("user_id", user.id)
          .gte("created_at", weekAgo.toISOString()),
      ]);

    const convos = convosRes.data || [];
    const moods = moodRes.data || [];
    const goals = goalsRes.data || [];
    const memories = memoriesRes.data || [];
    const journal = journalRes.data || [];
    const activities = activityRes.data || [];

    // Sessions this week vs last week
    const thisWeekConvos = convos.filter(
      (c) => new Date(c.started_at) >= weekAgo
    );
    const lastWeekConvos = convos.filter(
      (c) =>
        new Date(c.started_at) >= twoWeeksAgo &&
        new Date(c.started_at) < weekAgo
    );

    const sessionsThisWeek = thisWeekConvos.length;
    const sessionsLastWeek = lastWeekConvos.length;
    const sessionsDelta =
      sessionsLastWeek > 0
        ? Math.round(
            ((sessionsThisWeek - sessionsLastWeek) / sessionsLastWeek) * 100
          )
        : sessionsThisWeek > 0
          ? 100
          : 0;

    // Most active coach this week
    const coachSessionCounts: Record<string, number> = {};
    for (const c of thisWeekConvos) {
      coachSessionCounts[c.coach_id] = (coachSessionCounts[c.coach_id] || 0) + 1;
    }
    const topCoachId = Object.entries(coachSessionCounts).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0];
    const topCoach = topCoachId
      ? coaches.find((c) => c.id === topCoachId)
      : null;

    // Mood trajectory
    const moodValues: Record<string, number> = {
      great: 5,
      good: 4,
      okay: 3,
      low: 2,
      bad: 1,
    };
    const moodNumbers = moods.map((m) => moodValues[m.mood] || 3);
    let moodDirection: "improving" | "declining" | "stable" = "stable";
    if (moodNumbers.length >= 3) {
      const firstHalf =
        moodNumbers.slice(0, Math.floor(moodNumbers.length / 2));
      const secondHalf =
        moodNumbers.slice(Math.floor(moodNumbers.length / 2));
      const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const avgSecond =
        secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      if (avgSecond - avgFirst > 0.4) moodDirection = "improving";
      else if (avgFirst - avgSecond > 0.4) moodDirection = "declining";
    }
    const avgMood =
      moodNumbers.length > 0
        ? Math.round(
            (moodNumbers.reduce((a, b) => a + b, 0) / moodNumbers.length) * 10
          ) / 10
        : null;

    // Goal progress — goals updated this week
    const goalsUpdatedThisWeek = goals.filter(
      (g) => new Date(g.updated_at) >= weekAgo
    );
    const goalsCompletedThisWeek = goalsUpdatedThisWeek.filter(
      (g) => g.status === "completed"
    );

    // Coach-specific summaries
    const coachSummaries = Object.entries(coachSessionCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([coachId, sessionCount]) => {
        const coach = coaches.find((c) => c.id === coachId);
        const coachMemories = memories.filter((m) => m.coach_id === coachId);
        const coachGoals = goalsUpdatedThisWeek.filter(
          (g) => g.coach_id === coachId
        );
        return {
          coach_id: coachId,
          name: coach?.name || "Unknown",
          accent_color: coach?.accent_color || "#e8633b",
          domain: coach?.domain || "",
          sessions: sessionCount,
          newMemories: coachMemories.length,
          goalsUpdated: coachGoals.length,
          topMemory: coachMemories[0]?.fact || null,
        };
      });

    // Activity summary
    const activitySummary: Record<string, number> = {};
    for (const a of activities) {
      activitySummary[a.activity_type] =
        (activitySummary[a.activity_type] || 0) + 1;
    }

    return Response.json({
      weekOf: weekAgo.toISOString().slice(0, 10),
      sessions: {
        thisWeek: sessionsThisWeek,
        lastWeek: sessionsLastWeek,
        delta: sessionsDelta,
      },
      mood: {
        direction: moodDirection,
        average: avgMood,
        entries: moods.length,
        data: moods.map((m) => ({
          mood: m.mood,
          date: m.created_at,
        })),
      },
      goals: {
        active: goals.filter((g) => g.status === "active").length,
        completedThisWeek: goalsCompletedThisWeek.length,
        updatedThisWeek: goalsUpdatedThisWeek.length,
      },
      topCoach: topCoach
        ? {
            id: topCoach.id,
            name: topCoach.name,
            accent_color: topCoach.accent_color,
            sessions: coachSessionCounts[topCoach.id],
          }
        : null,
      coachSummaries,
      journal: {
        entries: journal.length,
        titles: journal.map((j) => j.title).slice(0, 5),
      },
      activities: activitySummary,
      memories: {
        total: memories.length,
        highlights: memories
          .slice(0, 5)
          .map((m) => ({
            coach_id: m.coach_id,
            text: m.fact,
            category: m.category,
          })),
      },
    });
  } catch (error) {
    console.error("Weekly review API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

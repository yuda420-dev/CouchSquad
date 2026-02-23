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
 * GET /api/recommendations
 *
 * Smart coach recommendations based on:
 * 1. Recent mood trends (suggest mental health coach if mood is low)
 * 2. Stale coaches (haven't talked to in a while)
 * 3. Active goals that need check-ins
 * 4. Coaches not yet on roster that match user's patterns
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

    // Load all data in parallel
    const [rosterRes, convosRes, moodRes, goalsRes, memoriesRes] = await Promise.all([
      supabase
        .from("user_roster")
        .select("coach_id, intake_completed")
        .eq("user_id", user.id)
        .eq("is_active", true),
      supabase
        .from("conversations")
        .select("coach_id, last_message_at, message_count")
        .eq("user_id", user.id)
        .gt("message_count", 0)
        .order("last_message_at", { ascending: false }),
      supabase
        .from("mood_entries")
        .select("mood, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(7),
      supabase
        .from("goals")
        .select("coach_id, title, status, progress, updated_at")
        .eq("user_id", user.id)
        .eq("status", "active"),
      supabase
        .from("coach_memory")
        .select("coach_id")
        .eq("user_id", user.id),
    ]);

    const roster = rosterRes.data || [];
    const convos = convosRes.data || [];
    const recentMoods = moodRes.data || [];
    const activeGoals = goalsRes.data || [];
    const memories = memoriesRes.data || [];

    const rosterIds = new Set(roster.map((r) => r.coach_id));
    const now = new Date();

    interface Recommendation {
      coach_id: string;
      name: string;
      accent_color: string;
      domain: string;
      sub_domain: string;
      reason: string;
      priority: number; // higher = more urgent
      type: "check_in" | "mood_support" | "goal_update" | "discover" | "stale" | "intake";
    }

    const recommendations: Recommendation[] = [];

    // 1. Incomplete intakes — highest priority
    for (const r of roster) {
      if (!r.intake_completed) {
        const coach = coaches.find((c) => c.id === r.coach_id);
        if (coach) {
          recommendations.push({
            coach_id: coach.id,
            name: coach.name,
            accent_color: coach.accent_color || "#e8633b",
            domain: coach.domain,
            sub_domain: coach.sub_domain || "",
            reason: `Complete your intake with ${coach.name.split(" ")[0]} so they can personalize your coaching.`,
            priority: 90,
            type: "intake",
          });
        }
      }
    }

    // 2. Mood-based — if recent moods are low, suggest mental health coaches
    const moodValues: Record<string, number> = {
      great: 5,
      good: 4,
      okay: 3,
      low: 2,
      bad: 1,
    };
    if (recentMoods.length >= 3) {
      const avgMood =
        recentMoods.reduce((sum, m) => sum + (moodValues[m.mood] || 3), 0) /
        recentMoods.length;

      if (avgMood <= 2.5) {
        // Suggest mental health coaches on roster, or recommend adding one
        const mentalHealthCoaches = coaches.filter(
          (c) => c.domain === "mental_health"
        );
        for (const coach of mentalHealthCoaches) {
          if (rosterIds.has(coach.id)) {
            recommendations.push({
              coach_id: coach.id,
              name: coach.name,
              accent_color: coach.accent_color || "#e8633b",
              domain: coach.domain,
              sub_domain: coach.sub_domain || "",
              reason: `Your mood has been low lately. ${coach.name.split(" ")[0]} can help you work through it.`,
              priority: 85,
              type: "mood_support",
            });
          } else {
            recommendations.push({
              coach_id: coach.id,
              name: coach.name,
              accent_color: coach.accent_color || "#e8633b",
              domain: coach.domain,
              sub_domain: coach.sub_domain || "",
              reason: `Consider adding ${coach.name.split(" ")[0]} to your squad — they specialize in ${coach.sub_domain || "mental wellness"}.`,
              priority: 70,
              type: "discover",
            });
          }
        }
      }
    }

    // 3. Stale coaches — haven't talked in 7+ days
    for (const r of roster) {
      const coachConvos = convos.filter((c) => c.coach_id === r.coach_id);
      const lastActive = coachConvos[0]?.last_message_at;

      if (lastActive) {
        const daysSince = Math.floor(
          (now.getTime() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSince >= 7) {
          const coach = coaches.find((c) => c.id === r.coach_id);
          if (coach) {
            recommendations.push({
              coach_id: coach.id,
              name: coach.name,
              accent_color: coach.accent_color || "#e8633b",
              domain: coach.domain,
              sub_domain: coach.sub_domain || "",
              reason: `You haven't chatted with ${coach.name.split(" ")[0]} in ${daysSince} days. Check in?`,
              priority: Math.min(60, 30 + daysSince),
              type: "stale",
            });
          }
        }
      } else if (coachConvos.length === 0) {
        // Never chatted
        const coach = coaches.find((c) => c.id === r.coach_id);
        if (coach && r.intake_completed) {
          recommendations.push({
            coach_id: coach.id,
            name: coach.name,
            accent_color: coach.accent_color || "#e8633b",
            domain: coach.domain,
            sub_domain: coach.sub_domain || "",
            reason: `You completed intake but haven't started coaching with ${coach.name.split(" ")[0]} yet!`,
            priority: 65,
            type: "check_in",
          });
        }
      }
    }

    // 4. Goals needing updates — stale goals (not updated in 7+ days)
    for (const goal of activeGoals) {
      const daysSinceUpdate = Math.floor(
        (now.getTime() - new Date(goal.updated_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceUpdate >= 7) {
        const coach = coaches.find((c) => c.id === goal.coach_id);
        if (coach) {
          // Avoid duplicate with stale coach
          const existingRec = recommendations.find(
            (r) => r.coach_id === goal.coach_id && r.type === "stale"
          );
          if (!existingRec) {
            recommendations.push({
              coach_id: coach.id,
              name: coach.name,
              accent_color: coach.accent_color || "#e8633b",
              domain: coach.domain,
              sub_domain: coach.sub_domain || "",
              reason: `Your goal "${goal.title}" (${goal.progress}%) hasn't been updated in ${daysSinceUpdate} days.`,
              priority: 55,
              type: "goal_update",
            });
          }
        }
      }
    }

    // 5. Discover — suggest coaches in domains the user doesn't have
    const userDomains = new Set(
      roster.map((r) => coaches.find((c) => c.id === r.coach_id)?.domain).filter(Boolean)
    );
    const uncoveredDomains = [
      "fitness",
      "nutrition",
      "mental_health",
      "finance",
      "career",
    ].filter((d) => !userDomains.has(d));

    for (const domain of uncoveredDomains.slice(0, 2)) {
      const domainCoaches = coaches.filter(
        (c) => c.domain === domain && !rosterIds.has(c.id)
      );
      if (domainCoaches.length > 0) {
        const coach = domainCoaches[0];
        recommendations.push({
          coach_id: coach.id,
          name: coach.name,
          accent_color: coach.accent_color || "#e8633b",
          domain: coach.domain,
          sub_domain: coach.sub_domain || "",
          reason: `No ${domain.replace("_", " ")} coach yet. ${coach.name.split(" ")[0]} could help.`,
          priority: 25,
          type: "discover",
        });
      }
    }

    // Sort by priority (highest first), deduplicate by coach_id
    const seen = new Set<string>();
    const sorted = recommendations
      .sort((a, b) => b.priority - a.priority)
      .filter((r) => {
        if (seen.has(r.coach_id)) return false;
        seen.add(r.coach_id);
        return true;
      })
      .slice(0, 6);

    return Response.json({ recommendations: sorted });
  } catch (error) {
    console.error("Recommendations API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

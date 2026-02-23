import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  createGoal,
  loadGoals,
  updateGoal,
  completeMilestone,
  uncompleteMilestone,
  addGoalCheckIn,
  getGoalStats,
} from "@/lib/supabase/goals";

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
 * GET /api/goals?coachId=xxx&stats=true
 * Load goals (optionally filtered by coach) or goal stats
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
    const wantStats = searchParams.get("stats") === "true";

    if (wantStats) {
      const stats = await getGoalStats(supabase, user.id);
      return Response.json({ stats });
    }

    const goals = await loadGoals(supabase, user.id, coachId || undefined);
    return Response.json({ goals });
  } catch (error) {
    console.error("Goals API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/goals
 * Create a goal, update a goal, complete/uncomplete milestone, or add check-in
 *
 * Body variants:
 *   { action: "create", coachId, title, description?, domain, target_date?, milestones? }
 *   { action: "update", goalId, updates: { title?, description?, status?, progress?, target_date? } }
 *   { action: "complete_milestone", milestoneId }
 *   { action: "uncomplete_milestone", milestoneId }
 *   { action: "check_in", goalId, coachId, note, progress, mood? }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "create": {
        const goal = await createGoal(supabase, user.id, body.coachId, {
          title: body.title,
          description: body.description,
          domain: body.domain,
          target_date: body.target_date,
          milestones: body.milestones,
        });
        return Response.json({ goal });
      }

      case "update": {
        const goal = await updateGoal(supabase, body.goalId, body.updates);
        return Response.json({ goal });
      }

      case "complete_milestone": {
        const milestone = await completeMilestone(supabase, body.milestoneId);
        return Response.json({ milestone });
      }

      case "uncomplete_milestone": {
        const milestone = await uncompleteMilestone(supabase, body.milestoneId);
        return Response.json({ milestone });
      }

      case "check_in": {
        const checkin = await addGoalCheckIn(supabase, {
          goal_id: body.goalId,
          user_id: user.id,
          coach_id: body.coachId,
          note: body.note,
          progress_at_checkin: body.progress,
          mood: body.mood,
        });
        return Response.json({ checkin });
      }

      default:
        return Response.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Goals API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

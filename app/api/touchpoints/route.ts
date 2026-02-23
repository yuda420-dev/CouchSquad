import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  loadTouchpoints,
  getUnreadCount,
  markRead,
  dismissTouchpoint,
  createTouchpoint,
  generateTouchpointContent,
} from "@/lib/supabase/touchpoints";
import { COACHES } from "@/lib/coaches/catalog";
import type { Coach, Touchpoint } from "@/lib/supabase/types";

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
 * GET /api/touchpoints?unreadCount=true
 * Load touchpoints or just get unread count
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    if (searchParams.get("unreadCount") === "true") {
      const count = await getUnreadCount(supabase, user.id);
      return Response.json({ count });
    }

    const touchpoints = await loadTouchpoints(supabase, user.id);
    return Response.json({ touchpoints });
  } catch (error) {
    console.error("Touchpoints API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/touchpoints
 *
 * Actions:
 *   { action: "mark_read", touchpointId }
 *   { action: "dismiss", touchpointId }
 *   { action: "generate" }  — generate new touchpoints for the user's roster
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
      case "mark_read": {
        await markRead(supabase, body.touchpointId);
        return Response.json({ success: true });
      }

      case "dismiss": {
        await dismissTouchpoint(supabase, body.touchpointId);
        return Response.json({ success: true });
      }

      case "generate": {
        // Generate a touchpoint for each roster coach
        const coaches = COACHES as unknown as Coach[];

        // Get user's roster
        const { data: roster } = await supabase
          .from("user_roster")
          .select("coach_id")
          .eq("user_id", user.id)
          .eq("is_active", true);

        if (!roster?.length) {
          return Response.json({ touchpoints: [], generated: 0 });
        }

        // Get user's active goals for context
        const { data: goals } = await supabase
          .from("goals")
          .select("title, coach_id")
          .eq("user_id", user.id)
          .eq("status", "active");

        // Get recent mood
        const { data: recentMoods } = await supabase
          .from("mood_entries")
          .select("mood")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        const recentMood = recentMoods?.[0]?.mood;

        // Check which coaches already have recent touchpoints (last 12 hours)
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
        const { data: recentTps } = await supabase
          .from("touchpoints")
          .select("coach_id")
          .eq("user_id", user.id)
          .gte("created_at", twelveHoursAgo);

        const recentCoachIds = new Set((recentTps || []).map((t) => t.coach_id));

        const types: Touchpoint["touchpoint_type"][] = [
          "motivation",
          "accountability",
          "check_in",
          "celebration",
          "question",
          "tip",
          "challenge",
          "reflection",
          "resource",
          "milestone_reminder",
          "streak",
          "comeback",
        ];

        const created: Touchpoint[] = [];

        for (const rosterItem of roster) {
          // Skip if this coach already sent a touchpoint recently
          if (recentCoachIds.has(rosterItem.coach_id)) continue;

          const coach = coaches.find((c) => c.id === rosterItem.coach_id);
          if (!coach) continue;

          const coachGoals = (goals || [])
            .filter((g) => g.coach_id === coach.id)
            .map((g) => g.title);

          // Pick a random type
          const type = types[Math.floor(Math.random() * types.length)];

          const content = generateTouchpointContent(
            coach.name,
            coach.domain,
            type,
            coachGoals,
            recentMood
          );

          const tp = await createTouchpoint(supabase, {
            user_id: user.id,
            coach_id: coach.id,
            touchpoint_type: type,
            content,
          });

          if (tp) created.push(tp);
        }

        return Response.json({ touchpoints: created, generated: created.length });
      }

      default:
        return Response.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Touchpoints API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

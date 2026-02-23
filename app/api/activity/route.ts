import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  createActivityLog,
  loadActivityLogs,
  getActivityStats,
  deleteActivityLog,
} from "@/lib/supabase/activity-logs";

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
 * GET /api/activity
 * Query params: coachId, activityType, stats (boolean)
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

    const { searchParams } = new URL(request.url);
    const coachId = searchParams.get("coachId") || undefined;
    const activityType = searchParams.get("activityType") || undefined;
    const wantStats = searchParams.get("stats") === "true";

    if (wantStats) {
      const stats = await getActivityStats(supabase, user.id, coachId);
      return Response.json({ stats });
    }

    const logs = await loadActivityLogs(supabase, user.id, {
      coachId,
      activityType,
    });
    return Response.json({ logs });
  } catch (error) {
    console.error("Activity API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/activity
 * Body: { action, ...data }
 * Actions: "log", "delete"
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
    const { action } = body;

    if (action === "log") {
      const { coachId, activityType, title, data, notes } = body;
      if (!coachId || !activityType || !title) {
        return Response.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }

      const log = await createActivityLog(supabase, {
        user_id: user.id,
        coach_id: coachId,
        activity_type: activityType,
        title,
        data: data || {},
        notes,
      });

      return Response.json({ log });
    }

    if (action === "delete") {
      const { logId } = body;
      if (!logId) {
        return Response.json({ error: "Missing logId" }, { status: 400 });
      }
      await deleteActivityLog(supabase, logId);
      return Response.json({ success: true });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Activity API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

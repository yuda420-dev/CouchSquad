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
 * GET /api/habits
 * Load all habits with their completion history.
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

    // Get habits
    const { data: habits } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    // Get completions for last 30 days
    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: completions } = await supabase
      .from("habit_completions")
      .select("habit_id, completed_date")
      .eq("user_id", user.id)
      .gte("completed_date", thirtyDaysAgo.slice(0, 10));

    // Calculate streaks
    const today = new Date().toISOString().slice(0, 10);
    const habitsWithStreaks = (habits || []).map((habit) => {
      const habitCompletions = (completions || [])
        .filter((c) => c.habit_id === habit.id)
        .map((c) => c.completed_date)
        .sort()
        .reverse();

      let streak = 0;
      const checkDate = new Date();
      // If not completed today, start checking from yesterday
      if (!habitCompletions.includes(today)) {
        checkDate.setDate(checkDate.getDate() - 1);
      }

      while (true) {
        const dateStr = checkDate.toISOString().slice(0, 10);
        if (habitCompletions.includes(dateStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      return {
        ...habit,
        streak,
        completedToday: habitCompletions.includes(today),
        recentCompletions: habitCompletions.slice(0, 7),
      };
    });

    return Response.json({ habits: habitsWithStreaks });
  } catch (error) {
    console.error("Habits GET error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/habits
 * Create a habit, toggle completion, or delete.
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

    if (action === "create") {
      const { name, emoji, coachId, frequency } = body;
      if (!name) {
        return Response.json({ error: "Name required" }, { status: 400 });
      }

      const { data, error } = await supabase
        .from("habits")
        .insert({
          user_id: user.id,
          name,
          emoji: emoji || "✅",
          coach_id: coachId || null,
          frequency: frequency || "daily",
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }

      return Response.json({ habit: data });
    } else if (action === "toggle") {
      const { habitId, date } = body;
      const completionDate = date || new Date().toISOString().slice(0, 10);

      // Check if already completed
      const { data: existing } = await supabase
        .from("habit_completions")
        .select("id")
        .eq("user_id", user.id)
        .eq("habit_id", habitId)
        .eq("completed_date", completionDate)
        .single();

      if (existing) {
        // Remove completion
        await supabase
          .from("habit_completions")
          .delete()
          .eq("id", existing.id);
        return Response.json({ completed: false });
      } else {
        // Add completion
        await supabase.from("habit_completions").insert({
          user_id: user.id,
          habit_id: habitId,
          completed_date: completionDate,
        });
        return Response.json({ completed: true });
      }
    } else if (action === "delete") {
      const { habitId } = body;

      await supabase
        .from("habits")
        .update({ is_active: false })
        .eq("id", habitId)
        .eq("user_id", user.id);

      return Response.json({ ok: true });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Habits POST error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

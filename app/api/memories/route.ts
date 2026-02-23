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
 * GET /api/memories?coachId=xxx
 * Load all memories, optionally filtered by coach.
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

    const coachId = request.nextUrl.searchParams.get("coachId");

    let query = supabase
      .from("coach_memory")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (coachId) {
      query = query.eq("coach_id", coachId);
    }

    const { data, error } = await query;

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ memories: data || [] });
  } catch (error) {
    console.error("Memories GET error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/memories
 * Edit or delete a memory.
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
    const { action, memoryId, fact, category, importance } = body;

    if (action === "update") {
      if (!memoryId) {
        return Response.json({ error: "Missing memoryId" }, { status: 400 });
      }

      const updates: Record<string, unknown> = {};
      if (fact !== undefined) updates.fact = fact;
      if (category !== undefined) updates.category = category;
      if (importance !== undefined) updates.importance = importance;

      const { error } = await supabase
        .from("coach_memory")
        .update(updates)
        .eq("id", memoryId)
        .eq("user_id", user.id);

      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }

      return Response.json({ ok: true });
    } else if (action === "delete") {
      if (!memoryId) {
        return Response.json({ error: "Missing memoryId" }, { status: 400 });
      }

      const { error } = await supabase
        .from("coach_memory")
        .delete()
        .eq("id", memoryId)
        .eq("user_id", user.id);

      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }

      return Response.json({ ok: true });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Memories POST error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

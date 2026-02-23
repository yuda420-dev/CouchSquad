import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { UserCoachSettings } from "@/lib/supabase/types";

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
 * GET /api/settings?coachId=xxx
 * Load personality overrides + settings for a specific coach
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const coachId = new URL(request.url).searchParams.get("coachId");
    if (!coachId) {
      return Response.json({ error: "Missing coachId" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("user_coach_settings")
      .select("*")
      .eq("user_id", user.id)
      .eq("coach_id", coachId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows — that's fine
      console.error("Settings load error:", error);
    }

    return Response.json({
      settings: data as UserCoachSettings | null,
    });
  } catch (error) {
    console.error("Settings API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/settings
 * Save personality overrides + settings for a specific coach
 * Body: { coachId, personalityOverrides, notificationFrequency? }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      coachId,
      personalityOverrides = {},
      notificationFrequency,
    } = await request.json();

    if (!coachId) {
      return Response.json({ error: "Missing coachId" }, { status: 400 });
    }

    // Upsert settings
    const { data, error } = await supabase
      .from("user_coach_settings")
      .upsert(
        {
          user_id: user.id,
          coach_id: coachId,
          personality_overrides: personalityOverrides,
          ...(notificationFrequency && { notification_frequency: notificationFrequency }),
        },
        {
          onConflict: "user_id,coach_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Settings save error:", error);
      return Response.json({ error: "Failed to save settings" }, { status: 500 });
    }

    return Response.json({ settings: data as UserCoachSettings });
  } catch (error) {
    console.error("Settings API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

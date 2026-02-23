import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  createJournalEntry,
  loadJournalEntries,
  updateJournalEntry,
  deleteJournalEntry,
  logMood,
  getMoodHistory,
  getJournalStats,
} from "@/lib/supabase/journal";

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
 * GET /api/journal?type=entries|moods|stats&coachId=xxx&limit=20&offset=0&days=30
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "entries";

    switch (type) {
      case "entries": {
        const limit = parseInt(searchParams.get("limit") || "20");
        const offset = parseInt(searchParams.get("offset") || "0");
        const coachId = searchParams.get("coachId") || undefined;
        const entries = await loadJournalEntries(supabase, user.id, { limit, offset, coachId });
        return Response.json({ entries });
      }

      case "moods": {
        const days = parseInt(searchParams.get("days") || "30");
        const moods = await getMoodHistory(supabase, user.id, days);
        return Response.json({ moods });
      }

      case "stats": {
        const stats = await getJournalStats(supabase, user.id);
        return Response.json({ stats });
      }

      default:
        return Response.json({ error: "Unknown type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Journal API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/journal
 *
 * Body variants:
 *   { action: "create_entry", content, mood?, energy?, time_period?, tags?, coach_tags? }
 *   { action: "update_entry", entryId, updates: { content?, mood?, energy?, tags?, coach_tags? } }
 *   { action: "delete_entry", entryId }
 *   { action: "log_mood", mood, energy?, note? }
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
      case "create_entry": {
        const entry = await createJournalEntry(supabase, user.id, {
          content: body.content,
          mood: body.mood,
          energy: body.energy,
          time_period: body.time_period,
          tags: body.tags,
          coach_tags: body.coach_tags,
        });
        return Response.json({ entry });
      }

      case "update_entry": {
        const entry = await updateJournalEntry(supabase, body.entryId, body.updates);
        return Response.json({ entry });
      }

      case "delete_entry": {
        const success = await deleteJournalEntry(supabase, body.entryId);
        return Response.json({ success });
      }

      case "log_mood": {
        const mood = await logMood(supabase, user.id, {
          mood: body.mood,
          energy: body.energy,
          note: body.note,
        });
        return Response.json({ mood });
      }

      default:
        return Response.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Journal API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

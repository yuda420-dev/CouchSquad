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
 * GET /api/bookmarks?coachId=xxx
 * Load all bookmarks for a user, optionally filtered by coach
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

    let query = supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (coachId) {
      query = query.eq("coach_id", coachId);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Bookmarks load error:", error);
      return Response.json({ bookmarks: [] });
    }

    return Response.json({ bookmarks: data || [] });
  } catch (error) {
    console.error("Bookmarks API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/bookmarks
 *
 * Actions:
 *   { action: "add", messageId, coachId, contentPreview, note? }
 *   { action: "remove", bookmarkId }
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
      case "add": {
        const { data, error } = await supabase
          .from("bookmarks")
          .insert({
            user_id: user.id,
            message_id: body.messageId,
            coach_id: body.coachId,
            content_preview: body.contentPreview.slice(0, 500),
            note: body.note || null,
          })
          .select()
          .single();

        if (error) {
          console.error("Bookmark add error:", error);
          return Response.json({ error: "Failed to bookmark" }, { status: 500 });
        }
        return Response.json({ bookmark: data });
      }

      case "remove": {
        await supabase
          .from("bookmarks")
          .delete()
          .eq("id", body.bookmarkId)
          .eq("user_id", user.id);

        return Response.json({ success: true });
      }

      default:
        return Response.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Bookmarks API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

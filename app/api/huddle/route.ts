import { NextRequest } from "next/server";
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
 * GET /api/huddle
 * Get the "huddle" — cross-coach insights, shared memories, and coordination data.
 * Returns a summary of what each coach knows and patterns across coaches.
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const coaches = COACHES as unknown as Coach[];

    // Load all data in parallel
    const [rosterRes, memoriesRes, goalsRes, journalRes, conversationsRes] = await Promise.all([
      supabase
        .from("user_roster")
        .select("coach_id, intake_completed")
        .eq("user_id", user.id)
        .eq("is_active", true),

      supabase
        .from("coach_memory")
        .select("coach_id, fact, category, importance")
        .eq("user_id", user.id)
        .order("importance", { ascending: false }),

      supabase
        .from("goals")
        .select("coach_id, title, status, progress, domain")
        .eq("user_id", user.id),

      supabase
        .from("journal_entries")
        .select("content, mood, coach_tags, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),

      supabase
        .from("conversations")
        .select("coach_id, message_count, last_message_at")
        .eq("user_id", user.id)
        .gt("message_count", 0),
    ]);

    const roster = rosterRes.data || [];
    const memories = memoriesRes.data || [];
    const goals = goalsRes.data || [];
    const journal = journalRes.data || [];
    const conversations = conversationsRes.data || [];

    // Build per-coach summaries
    const coachSummaries = roster.map((r) => {
      const coach = coaches.find((c) => c.id === r.coach_id);
      const coachMemories = memories.filter((m) => m.coach_id === r.coach_id);
      const coachGoals = goals.filter((g) => g.coach_id === r.coach_id);
      const coachConvos = conversations.filter((c) => c.coach_id === r.coach_id);
      const totalMessages = coachConvos.reduce((sum, c) => sum + c.message_count, 0);
      const lastActive = coachConvos
        .filter((c) => c.last_message_at)
        .map((c) => c.last_message_at!)
        .sort()
        .reverse()[0];

      return {
        coach_id: r.coach_id,
        name: coach?.name || "Unknown",
        domain: coach?.domain || "",
        sub_domain: coach?.sub_domain || "",
        accent_color: coach?.accent_color || "#e8633b",
        intake_completed: r.intake_completed,
        memories: coachMemories.slice(0, 5).map((m) => ({
          fact: m.fact,
          category: m.category,
          importance: m.importance,
        })),
        memory_count: coachMemories.length,
        goals: coachGoals.map((g) => ({
          title: g.title,
          status: g.status,
          progress: g.progress,
        })),
        sessions: coachConvos.length,
        total_messages: totalMessages,
        last_active: lastActive || null,
      };
    });

    // Cross-coach patterns
    const allMemories = memories.map((m) => {
      const coach = coaches.find((c) => c.id === m.coach_id);
      return { ...m, coach_name: coach?.name || "Unknown" };
    });

    // Find shared themes — memories that appear across multiple coaches
    const factWords = new Map<string, { coaches: Set<string>; facts: string[] }>();
    for (const mem of allMemories) {
      const words = mem.fact.toLowerCase().split(/\s+/).filter((w: string) => w.length > 4);
      for (const word of words) {
        if (!factWords.has(word)) {
          factWords.set(word, { coaches: new Set(), facts: [] });
        }
        const entry = factWords.get(word)!;
        entry.coaches.add(mem.coach_name);
        if (entry.facts.length < 3) entry.facts.push(mem.fact);
      }
    }

    const crossCoachThemes = Array.from(factWords.entries())
      .filter(([, val]) => val.coaches.size >= 2)
      .sort((a, b) => b[1].coaches.size - a[1].coaches.size)
      .slice(0, 5)
      .map(([keyword, val]) => ({
        keyword,
        coaches: Array.from(val.coaches),
        example_facts: val.facts,
      }));

    // Journal entries tagged for multiple coaches
    const crossCoachJournals = journal
      .filter((j) => j.coach_tags && j.coach_tags.length >= 2)
      .slice(0, 3)
      .map((j) => ({
        preview: j.content.slice(0, 150),
        mood: j.mood,
        coach_tags: j.coach_tags,
        created_at: j.created_at,
      }));

    // Overall patterns
    const totalMemories = memories.length;
    const totalGoals = goals.length;
    const activeGoals = goals.filter((g) => g.status === "active").length;
    const domains = [...new Set(roster.map((r) => coaches.find((c) => c.id === r.coach_id)?.domain).filter(Boolean))];

    return Response.json({
      coachSummaries,
      crossCoachThemes,
      crossCoachJournals,
      overview: {
        totalCoaches: roster.length,
        totalMemories,
        totalGoals,
        activeGoals,
        domains,
      },
    });
  } catch (error) {
    console.error("Huddle API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

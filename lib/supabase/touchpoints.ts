/**
 * Proactive Touchpoints — Supabase operations
 *
 * Coaches proactively reach out with check-ins, motivation,
 * accountability, celebrations, and thought-provoking questions.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Touchpoint } from "@/lib/supabase/types";

type Client = SupabaseClient<any>;

/** Load touchpoints for a user (pending + recent delivered) */
export async function loadTouchpoints(
  supabase: Client,
  userId: string,
  options: { status?: string; limit?: number } = {}
): Promise<Touchpoint[]> {
  const { status, limit = 50 } = options;

  let query = supabase
    .from("touchpoints")
    .select("*")
    .eq("user_id", userId)
    .order("scheduled_for", { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq("status", status);
  } else {
    // Default: show delivered + read (not dismissed or pending far in future)
    query = query.in("status", ["delivered", "read", "pending"]);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error loading touchpoints:", error);
    return [];
  }
  return data || [];
}

/** Get unread (delivered but not read) count */
export async function getUnreadCount(
  supabase: Client,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("touchpoints")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "delivered");

  if (error) return 0;
  return count || 0;
}

/** Mark a touchpoint as read */
export async function markRead(
  supabase: Client,
  touchpointId: string
): Promise<void> {
  await supabase
    .from("touchpoints")
    .update({ status: "read", read_at: new Date().toISOString() })
    .eq("id", touchpointId);
}

/** Dismiss a touchpoint */
export async function dismissTouchpoint(
  supabase: Client,
  touchpointId: string
): Promise<void> {
  await supabase
    .from("touchpoints")
    .update({ status: "dismissed" })
    .eq("id", touchpointId);
}

/** Create a touchpoint */
export async function createTouchpoint(
  supabase: Client,
  data: {
    user_id: string;
    coach_id: string;
    touchpoint_type: Touchpoint["touchpoint_type"];
    content: string;
    scheduled_for?: string;
  }
): Promise<Touchpoint | null> {
  const { data: tp, error } = await supabase
    .from("touchpoints")
    .insert({
      user_id: data.user_id,
      coach_id: data.coach_id,
      touchpoint_type: data.touchpoint_type,
      content: data.content,
      scheduled_for: data.scheduled_for || new Date().toISOString(),
      status: "delivered",
      delivered_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating touchpoint:", error);
    return null;
  }
  return tp;
}

/**
 * Generate touchpoints for a user's roster coaches.
 * Uses AI to create personalized messages based on coach personality + user context.
 * For MVP, uses template-based generation.
 */
export function generateTouchpointContent(
  coachName: string,
  coachDomain: string,
  type: Touchpoint["touchpoint_type"],
  userGoals: string[] = [],
  recentMood?: string
): string {
  const firstName = coachName.split(" ")[0];

  const domain = coachDomain.toLowerCase();

  const templates: Record<string, string[]> = {
    motivation: [
      `Hey! Just wanted to check in. Remember, every small step forward in ${domain} counts. You've got this. 💪`,
      `Good morning! Here's your reminder from ${firstName}: consistency beats perfection. What's one thing you can do today?`,
      `${firstName} here — I've been thinking about our last conversation. You're making more progress than you realize. Keep going.`,
    ],
    accountability: [
      `Hey! You mentioned wanting to make progress in ${domain}. How's it going this week? Even showing up counts.`,
      ...(userGoals.length > 0
        ? [`You set a goal: "${userGoals[0]}". How's that tracking? Let me know where you're at.`]
        : []),
      `Quick check-in from ${firstName} — what's one win and one challenge from this week?`,
    ],
    check_in: [
      `Hey there! It's been a little while. Everything okay? I'm here whenever you want to talk about ${domain}.`,
      `${firstName} checking in — how are you feeling today? No agenda, just curious how you're doing.`,
      ...(recentMood === "low" || recentMood === "bad"
        ? [`I noticed you've been going through a tough stretch. Remember, it's okay to have hard days. Want to talk about it?`]
        : []),
    ],
    celebration: [
      `Hey, I wanted to acknowledge something — you've been showing up consistently. That takes real commitment. I see you! 🎉`,
      `${firstName} here with a reminder: take a moment to appreciate how far you've come. You're doing great.`,
    ],
    question: [
      `Something to sit with today: What would you tell your future self about the effort you're putting in right now?`,
      `${firstName} has a question for you: If you could change one small habit starting tomorrow, what would it be?`,
      `Here's something to think about: What's the biggest thing holding you back in ${domain} right now?`,
    ],
    tip: [
      `Quick tip from ${firstName}: One of the most underrated things in ${domain} is consistency over intensity. Small daily actions compound.`,
      `${firstName}'s tip of the day: When you're stuck, change your environment. New space, new perspective. Works every time.`,
      `Something I tell everyone I work with: don't compare your chapter 1 to someone else's chapter 20. Focus on YOUR path.`,
    ],
    challenge: [
      `Mini challenge from ${firstName}: For the next 3 days, try one new thing in ${domain}. Something you haven't done before. Report back. 🎯`,
      `I'm throwing down a challenge: 7 days of consistency. No excuses, no perfection needed — just show up. You in?`,
      ...(userGoals.length > 0
        ? [`Challenge: This week, do ONE thing that moves "${userGoals[0]}" forward. Just one. What will it be?`]
        : [`Challenge: Pick one area of ${domain} you've been avoiding. Spend 15 minutes on it this week. That's it.`]),
    ],
    reflection: [
      `End-of-day reflection from ${firstName}: What went well today? What would you do differently? No judgment — just awareness.`,
      `Take a minute right now. Close your eyes. How does your body feel? What's your energy level? Sometimes checking in with yourself is the most productive thing you can do.`,
      `${firstName} here with a journal prompt: Write down 3 things you're grateful for in your ${domain} journey so far. Even small ones count.`,
    ],
    resource: [
      `${firstName} here — based on where you are in your ${domain} journey, you might benefit from doing a focused intake session with me. We can build a structured plan together.`,
      `Pro tip: Use the journal feature to track your thoughts after our sessions. I can see your entries and use them to give better advice next time.`,
      `Have you tried setting a specific goal with me? I can help you break it into milestones and track progress. It makes a huge difference.`,
    ],
    milestone_reminder: [
      ...(userGoals.length > 0
        ? [`Remember your goal: "${userGoals[0]}"? Where are you on a scale of 1-10? Let's update your progress together.`]
        : [`You haven't set any goals with me yet. Want to define one? Even a small target gives us something to work toward.`]),
      `${firstName} checking in on your milestones. Progress isn't always linear — sometimes a plateau means you're about to break through.`,
    ],
    streak: [
      `You've been showing up consistently — keep that streak alive! 🔥 Every day you show up is a vote for the person you're becoming.`,
      `${firstName} here — I love that you've been consistent lately. Momentum is the most powerful force in personal development.`,
    ],
    comeback: [
      `Hey, it's been a minute! No judgment, life happens. The best part? You can pick right back up today. I'm still here. 👋`,
      `${firstName} here — noticed we haven't talked in a while. Everything okay? Remember, coming back after a break takes courage. Respect.`,
      `Miss you! Kidding... kind of. But seriously, whenever you're ready to jump back into ${domain}, I'm here. No guilt, just progress.`,
    ],
  };

  const typeTemplates = templates[type] || templates.motivation;
  return typeTemplates[Math.floor(Math.random() * typeTemplates.length)];
}

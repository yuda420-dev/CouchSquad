/**
 * Goal Setting & Tracking — Supabase operations
 *
 * Each coach helps set 1-3 goals in their domain.
 * Goals have measurable milestones with target dates.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// Using any to avoid TS generic resolution issues with Supabase typed client
type Client = SupabaseClient<any>;

export interface Goal {
  id: string;
  user_id: string;
  coach_id: string;
  title: string;
  description: string | null;
  domain: string;
  status: "active" | "completed" | "paused" | "abandoned";
  target_date: string | null;
  progress: number; // 0-100
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  goal_id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
}

export interface GoalCheckIn {
  id: string;
  goal_id: string;
  user_id: string;
  coach_id: string;
  note: string;
  progress_at_checkin: number;
  mood: "great" | "good" | "okay" | "struggling" | null;
  created_at: string;
}

/** Create a new goal for a user+coach */
export async function createGoal(
  supabase: Client,
  userId: string,
  coachId: string,
  data: {
    title: string;
    description?: string;
    domain: string;
    target_date?: string;
    milestones?: { title: string; target_date?: string }[];
  }
): Promise<Goal | null> {
  const { data: goal, error } = await supabase
    .from("goals")
    .insert({
      user_id: userId,
      coach_id: coachId,
      title: data.title,
      description: data.description || null,
      domain: data.domain,
      status: "active",
      target_date: data.target_date || null,
      progress: 0,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating goal:", error);
    return null;
  }

  // Create milestones if provided
  if (data.milestones?.length && goal) {
    const milestoneRows = data.milestones.map((m, i) => ({
      goal_id: goal.id,
      title: m.title,
      target_date: m.target_date || null,
      sort_order: i,
    }));

    await supabase.from("milestones").insert(milestoneRows);
  }

  return goal;
}

/** Load all goals for a user, optionally filtered by coach */
export async function loadGoals(
  supabase: Client,
  userId: string,
  coachId?: string
): Promise<(Goal & { milestones: Milestone[] })[]> {
  let query = supabase
    .from("goals")
    .select("*, milestones(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (coachId) {
    query = query.eq("coach_id", coachId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error loading goals:", error);
    return [];
  }
  return data || [];
}

/** Update goal progress and/or status */
export async function updateGoal(
  supabase: Client,
  goalId: string,
  updates: Partial<Pick<Goal, "title" | "description" | "status" | "progress" | "target_date">>
): Promise<Goal | null> {
  const { data, error } = await supabase
    .from("goals")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", goalId)
    .select()
    .single();

  if (error) {
    console.error("Error updating goal:", error);
    return null;
  }
  return data;
}

/** Complete a milestone */
export async function completeMilestone(
  supabase: Client,
  milestoneId: string
): Promise<Milestone | null> {
  const { data, error } = await supabase
    .from("milestones")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", milestoneId)
    .select()
    .single();

  if (error) {
    console.error("Error completing milestone:", error);
    return null;
  }
  return data;
}

/** Uncomplete a milestone */
export async function uncompleteMilestone(
  supabase: Client,
  milestoneId: string
): Promise<Milestone | null> {
  const { data, error } = await supabase
    .from("milestones")
    .update({ completed_at: null })
    .eq("id", milestoneId)
    .select()
    .single();

  if (error) {
    console.error("Error uncompleting milestone:", error);
    return null;
  }
  return data;
}

/** Add a check-in note to a goal */
export async function addGoalCheckIn(
  supabase: Client,
  data: {
    goal_id: string;
    user_id: string;
    coach_id: string;
    note: string;
    progress_at_checkin: number;
    mood?: "great" | "good" | "okay" | "struggling";
  }
): Promise<GoalCheckIn | null> {
  const { data: checkin, error } = await supabase
    .from("goal_check_ins")
    .insert({
      goal_id: data.goal_id,
      user_id: data.user_id,
      coach_id: data.coach_id,
      note: data.note,
      progress_at_checkin: data.progress_at_checkin,
      mood: data.mood || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding check-in:", error);
    return null;
  }
  return checkin;
}

/** Load check-ins for a goal */
export async function loadCheckIns(
  supabase: Client,
  goalId: string,
  limit = 20
): Promise<GoalCheckIn[]> {
  const { data, error } = await supabase
    .from("goal_check_ins")
    .select("*")
    .eq("goal_id", goalId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error loading check-ins:", error);
    return [];
  }
  return data || [];
}

/** Get summary stats for a user's goals */
export async function getGoalStats(
  supabase: Client,
  userId: string
): Promise<{
  total: number;
  active: number;
  completed: number;
  avgProgress: number;
}> {
  const { data, error } = await supabase
    .from("goals")
    .select("status, progress")
    .eq("user_id", userId);

  if (error || !data) {
    return { total: 0, active: 0, completed: 0, avgProgress: 0 };
  }

  const total = data.length;
  const active = data.filter((g) => g.status === "active").length;
  const completed = data.filter((g) => g.status === "completed").length;
  const activeGoals = data.filter((g) => g.status === "active");
  const avgProgress = activeGoals.length
    ? Math.round(activeGoals.reduce((sum, g) => sum + g.progress, 0) / activeGoals.length)
    : 0;

  return { total, active, completed, avgProgress };
}

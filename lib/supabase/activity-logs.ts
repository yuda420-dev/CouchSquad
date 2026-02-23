/**
 * Domain-Specific Activity Logs
 *
 * Structured logging for domain-specific activities:
 * - Fitness: workouts, exercises, sets/reps
 * - Nutrition: meals, macros, water intake
 * - Finance: budget snapshots, savings, expenses
 * - Mental Health: CBT records, meditation sessions
 * - Generic: any structured log entry
 */

import type { SupabaseClient } from "@supabase/supabase-js";

type Client = SupabaseClient<any>;

export interface ActivityLog {
  id: string;
  user_id: string;
  coach_id: string;
  activity_type: string; // "workout" | "meal" | "meditation" | "budget" | "habit" | etc.
  title: string;
  data: Record<string, any>; // Structured JSON data
  notes?: string;
  created_at: string;
}

/** Create an activity log entry */
export async function createActivityLog(
  supabase: Client,
  log: {
    user_id: string;
    coach_id: string;
    activity_type: string;
    title: string;
    data: Record<string, any>;
    notes?: string;
  }
): Promise<ActivityLog | null> {
  const { data, error } = await supabase
    .from("activity_logs")
    .insert({
      user_id: log.user_id,
      coach_id: log.coach_id,
      activity_type: log.activity_type,
      title: log.title,
      data: log.data,
      notes: log.notes || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating activity log:", error);
    return null;
  }
  return data;
}

/** Load activity logs for a user, optionally filtered */
export async function loadActivityLogs(
  supabase: Client,
  userId: string,
  options: {
    coachId?: string;
    activityType?: string;
    limit?: number;
  } = {}
): Promise<ActivityLog[]> {
  const { coachId, activityType, limit = 50 } = options;

  let query = supabase
    .from("activity_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (coachId) query = query.eq("coach_id", coachId);
  if (activityType) query = query.eq("activity_type", activityType);

  const { data, error } = await query;
  if (error) {
    console.error("Error loading activity logs:", error);
    return [];
  }
  return data || [];
}

/** Get activity stats for a user */
export async function getActivityStats(
  supabase: Client,
  userId: string,
  coachId?: string
): Promise<{
  totalLogs: number;
  thisWeek: number;
  byType: Record<string, number>;
}> {
  let query = supabase
    .from("activity_logs")
    .select("activity_type, created_at")
    .eq("user_id", userId);

  if (coachId) query = query.eq("coach_id", coachId);

  const { data } = await query;
  const logs = data || [];

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const byType: Record<string, number> = {};
  let thisWeek = 0;

  for (const log of logs) {
    byType[log.activity_type] = (byType[log.activity_type] || 0) + 1;
    if (new Date(log.created_at) >= weekAgo) thisWeek++;
  }

  return { totalLogs: logs.length, thisWeek, byType };
}

/** Delete an activity log */
export async function deleteActivityLog(
  supabase: Client,
  logId: string
): Promise<void> {
  await supabase.from("activity_logs").delete().eq("id", logId);
}

// ── Domain-specific helpers ──

/** Workout log data structure */
export interface WorkoutData {
  type: "strength" | "cardio" | "hiit" | "yoga" | "other";
  duration_minutes: number;
  exercises: {
    name: string;
    sets?: number;
    reps?: number;
    weight?: number;
    weight_unit?: "lbs" | "kg";
    duration_seconds?: number;
  }[];
  intensity: "low" | "moderate" | "high" | "max";
  calories_burned?: number;
}

/** Meal log data structure */
export interface MealData {
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  foods: {
    name: string;
    portion?: string;
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
  }[];
  total_calories?: number;
  total_protein?: number;
  water_oz?: number;
  quality: "great" | "good" | "okay" | "poor";
}

/** Meditation log data structure */
export interface MeditationData {
  type: "guided" | "unguided" | "breathing" | "body_scan" | "walking";
  duration_minutes: number;
  focus_quality: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

/** Budget snapshot data structure */
export interface BudgetData {
  period: "daily" | "weekly" | "monthly";
  income?: number;
  expenses: { category: string; amount: number }[];
  savings?: number;
  total_spent: number;
  currency: string;
}

/** Habit completion data structure */
export interface HabitData {
  habit_name: string;
  completed: boolean;
  streak: number;
  notes?: string;
}

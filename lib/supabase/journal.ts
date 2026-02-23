/**
 * Journal & Mood Tracking — Supabase operations
 *
 * Daily journal entries, mood tracking, energy levels.
 * Coaches can be tagged on entries to see them in context.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

type Client = SupabaseClient<any>;

export type MoodLevel = "great" | "good" | "okay" | "low" | "bad";
export type EnergyLevel = "high" | "moderate" | "low";
export type TimePeriod = "morning" | "afternoon" | "evening";

export interface JournalEntry {
  id: string;
  user_id: string;
  content: string;
  mood: MoodLevel | null;
  energy: EnergyLevel | null;
  time_period: TimePeriod | null;
  tags: string[];
  coach_tags: string[];  // coach IDs tagged on this entry
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface MoodEntry {
  id: string;
  user_id: string;
  mood: MoodLevel;
  energy: EnergyLevel | null;
  note: string | null;
  created_at: string;
}

/** Create a journal entry */
export async function createJournalEntry(
  supabase: Client,
  userId: string,
  data: {
    content: string;
    mood?: MoodLevel;
    energy?: EnergyLevel;
    time_period?: TimePeriod;
    tags?: string[];
    coach_tags?: string[];
  }
): Promise<JournalEntry | null> {
  const { data: entry, error } = await supabase
    .from("journal_entries")
    .insert({
      user_id: userId,
      content: data.content,
      mood: data.mood || null,
      energy: data.energy || null,
      time_period: data.time_period || null,
      tags: data.tags || [],
      coach_tags: data.coach_tags || [],
      is_private: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating journal entry:", error);
    return null;
  }

  // Also create a mood entry if mood is set
  if (data.mood) {
    await supabase.from("mood_entries").insert({
      user_id: userId,
      mood: data.mood,
      energy: data.energy || null,
      note: data.content.slice(0, 200),
    });
  }

  return entry;
}

/** Load journal entries with pagination */
export async function loadJournalEntries(
  supabase: Client,
  userId: string,
  options: { limit?: number; offset?: number; coachId?: string } = {}
): Promise<JournalEntry[]> {
  const { limit = 20, offset = 0, coachId } = options;

  let query = supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (coachId) {
    query = query.contains("coach_tags", [coachId]);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error loading journal entries:", error);
    return [];
  }
  return data || [];
}

/** Update a journal entry */
export async function updateJournalEntry(
  supabase: Client,
  entryId: string,
  updates: Partial<Pick<JournalEntry, "content" | "mood" | "energy" | "tags" | "coach_tags">>
): Promise<JournalEntry | null> {
  const { data, error } = await supabase
    .from("journal_entries")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", entryId)
    .select()
    .single();

  if (error) {
    console.error("Error updating journal entry:", error);
    return null;
  }
  return data;
}

/** Delete a journal entry */
export async function deleteJournalEntry(
  supabase: Client,
  entryId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("journal_entries")
    .delete()
    .eq("id", entryId);

  if (error) {
    console.error("Error deleting journal entry:", error);
    return false;
  }
  return true;
}

/** Log a quick mood check (without full journal entry) */
export async function logMood(
  supabase: Client,
  userId: string,
  data: {
    mood: MoodLevel;
    energy?: EnergyLevel;
    note?: string;
  }
): Promise<MoodEntry | null> {
  const { data: entry, error } = await supabase
    .from("mood_entries")
    .insert({
      user_id: userId,
      mood: data.mood,
      energy: data.energy || null,
      note: data.note || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error logging mood:", error);
    return null;
  }
  return entry;
}

/** Get mood history for a user (for charts) */
export async function getMoodHistory(
  supabase: Client,
  userId: string,
  days = 30
): Promise<MoodEntry[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("mood_entries")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error loading mood history:", error);
    return [];
  }
  return data || [];
}

/** Get journal stats */
export async function getJournalStats(
  supabase: Client,
  userId: string
): Promise<{
  totalEntries: number;
  streak: number;
  thisWeek: number;
  avgMood: string | null;
}> {
  const { data: entries, error } = await supabase
    .from("journal_entries")
    .select("created_at, mood")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !entries?.length) {
    return { totalEntries: 0, streak: 0, thisWeek: 0, avgMood: null };
  }

  const totalEntries = entries.length;

  // Calculate streak (consecutive days with entries)
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const entryDates = new Set(
    entries.map((e) => {
      const d = new Date(e.created_at);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );

  let checkDate = new Date(today);
  // If no entry today, check from yesterday
  if (!entryDates.has(checkDate.getTime())) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (entryDates.has(checkDate.getTime())) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // This week
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeek = entries.filter((e) => new Date(e.created_at) >= weekAgo).length;

  // Average mood
  const moodValues: Record<string, number> = {
    great: 5,
    good: 4,
    okay: 3,
    low: 2,
    bad: 1,
  };
  const moodEntries = entries.filter((e) => e.mood);
  const avgMoodVal = moodEntries.length
    ? moodEntries.reduce((sum, e) => sum + (moodValues[e.mood] || 3), 0) / moodEntries.length
    : null;

  const moodLabels = ["bad", "bad", "low", "okay", "good", "great"];
  const avgMood = avgMoodVal ? moodLabels[Math.round(avgMoodVal)] || null : null;

  return { totalEntries, streak, thisWeek, avgMood };
}

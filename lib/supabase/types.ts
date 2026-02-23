// Database types — matches Supabase schema
// In production, generate these with `supabase gen types typescript`

export interface Coach {
  id: string;
  name: string;
  age: number | null;
  domain: string;
  sub_domain: string | null;
  avatar_url: string | null;
  tagline: string | null;
  backstory: string;
  philosophy: string;
  training_background: string | null;
  coaching_style: string | null;
  specialties: string[];
  catchphrase: string | null;
  default_personality: PersonalityTraits;
  system_prompt_template: string;
  ai_provider: "anthropic" | "openai";
  ai_model: string;
  accent_color: string | null;
  voice_id?: string | null;
  sample_messages: SampleMessage[] | null;
  popularity_score: number;
  created_at: string;
}

export interface SampleMessage {
  role: "user" | "assistant";
  content: string;
}

export interface PersonalityTraits {
  // Core communication style
  humor: number;         // 0-100: Serious ↔ Playful
  directness: number;    // 0-100: Gentle ↔ Blunt
  warmth: number;        // 0-100: Professional ↔ Empathetic
  formality: number;     // 0-100: Casual ↔ Formal
  // Coaching approach
  socratic: number;      // 0-100: Answers ↔ Questions
  intensity: number;     // 0-100: Relaxed ↔ Intense
  patience: number;      // 0-100: Brisk ↔ Unhurried
  detail: number;        // 0-100: Big-picture ↔ Granular
  // Relationship & vibe
  encouragement: number; // 0-100: Challenging ↔ Cheerleading
  storytelling: number;  // 0-100: Data-driven ↔ Narrative
  tough_love: number;    // 0-100: Supportive-first ↔ Tough-love
  adaptability: number;  // 0-100: Consistent ↔ Mood-adaptive
}

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string;
  goals: string[];
  preferences: Record<string, unknown>;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRoster {
  id: string;
  user_id: string;
  coach_id: string;
  added_at: string;
  is_active: boolean;
  intake_completed: boolean;
  last_interaction: string | null;
  coach?: Coach; // joined
}

export interface UserCoachSettings {
  id: string;
  user_id: string;
  coach_id: string;
  personality_overrides: Partial<PersonalityTraits>;
  notification_frequency: "off" | "low" | "normal" | "high";
  preferred_times: Record<string, unknown> | null;
  notes: string | null;
}

export interface Conversation {
  id: string;
  user_id: string;
  coach_id: string;
  conversation_type: "chat" | "intake" | "touchpoint" | "voice";
  title: string | null;
  started_at: string;
  last_message_at: string | null;
  message_count: number;
  is_archived: boolean;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface IntakeData {
  id: string;
  user_id: string;
  coach_id: string;
  question: string;
  answer: string;
  category: string | null;
  created_at: string;
}

export interface CoachMemory {
  id: string;
  user_id: string;
  coach_id: string;
  fact: string;
  category: "personal" | "goal" | "preference" | "achievement" | "challenge" | null;
  importance: number;
  source: "intake" | "conversation" | "wearable" | null;
  created_at: string;
  updated_at: string;
}

export interface Touchpoint {
  id: string;
  user_id: string;
  coach_id: string;
  touchpoint_type: "check_in" | "motivation" | "accountability" | "celebration" | "question" | "tip" | "challenge" | "reflection" | "resource" | "milestone_reminder" | "streak" | "comeback";
  content: string | null;
  scheduled_for: string;
  delivered_at: string | null;
  read_at: string | null;
  status: "pending" | "delivered" | "read" | "dismissed";
  created_at: string;
  coach?: Coach; // joined
}

export interface Goal {
  id: string;
  user_id: string;
  coach_id: string;
  title: string;
  description: string | null;
  domain: string;
  status: "active" | "completed" | "paused" | "abandoned";
  target_date: string | null;
  progress: number;
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

export interface JournalEntry {
  id: string;
  user_id: string;
  content: string;
  mood: "great" | "good" | "okay" | "low" | "bad" | null;
  energy: "high" | "moderate" | "low" | null;
  time_period: "morning" | "afternoon" | "evening" | null;
  tags: string[];
  coach_tags: string[];
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface MoodEntry {
  id: string;
  user_id: string;
  mood: "great" | "good" | "okay" | "low" | "bad";
  energy: "high" | "moderate" | "low" | null;
  note: string | null;
  created_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  message_id: string;
  coach_id: string;
  content_preview: string;
  note: string | null;
  created_at: string;
}

export interface ActivityLogRow {
  id: string;
  user_id: string;
  coach_id: string;
  activity_type: string;
  title: string;
  data: Record<string, any>;
  notes: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      coaches: { Row: Coach; Insert: Omit<Coach, "id" | "created_at">; Update: Partial<Coach> };
      profiles: { Row: Profile; Insert: Omit<Profile, "created_at" | "updated_at">; Update: Partial<Profile> };
      user_roster: { Row: UserRoster; Insert: Omit<UserRoster, "id" | "added_at">; Update: Partial<UserRoster> };
      user_coach_settings: { Row: UserCoachSettings; Insert: Omit<UserCoachSettings, "id">; Update: Partial<UserCoachSettings> };
      conversations: { Row: Conversation; Insert: Omit<Conversation, "id" | "started_at">; Update: Partial<Conversation> };
      messages: { Row: Message; Insert: Omit<Message, "id" | "created_at">; Update: Partial<Message> };
      intake_data: { Row: IntakeData; Insert: Omit<IntakeData, "id" | "created_at">; Update: Partial<IntakeData> };
      coach_memory: { Row: CoachMemory; Insert: Omit<CoachMemory, "id" | "created_at" | "updated_at">; Update: Partial<CoachMemory> };
      touchpoints: { Row: Touchpoint; Insert: Omit<Touchpoint, "id" | "created_at">; Update: Partial<Touchpoint> };
      goals: { Row: Goal; Insert: Omit<Goal, "id" | "created_at" | "updated_at">; Update: Partial<Goal> };
      milestones: { Row: Milestone; Insert: Omit<Milestone, "id" | "created_at">; Update: Partial<Milestone> };
      goal_check_ins: { Row: GoalCheckIn; Insert: Omit<GoalCheckIn, "id" | "created_at">; Update: Partial<GoalCheckIn> };
      journal_entries: { Row: JournalEntry; Insert: Omit<JournalEntry, "id" | "created_at" | "updated_at">; Update: Partial<JournalEntry> };
      mood_entries: { Row: MoodEntry; Insert: Omit<MoodEntry, "id" | "created_at">; Update: Partial<MoodEntry> };
      bookmarks: { Row: Bookmark; Insert: Omit<Bookmark, "id" | "created_at">; Update: Partial<Bookmark> };
      activity_logs: { Row: ActivityLogRow; Insert: Omit<ActivityLogRow, "id" | "created_at">; Update: Partial<ActivityLogRow> };
    };
  };
}

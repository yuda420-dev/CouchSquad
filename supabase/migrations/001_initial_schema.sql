-- CoachSquad initial schema
-- Run this in your Supabase SQL Editor

-- Coaches catalog (seeded, not user-editable)
CREATE TABLE IF NOT EXISTS coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  age INT,
  domain TEXT NOT NULL,
  sub_domain TEXT,
  avatar_url TEXT,
  tagline TEXT,
  backstory TEXT NOT NULL,
  philosophy TEXT NOT NULL,
  training_background TEXT,
  coaching_style TEXT,
  specialties TEXT[],
  catchphrase TEXT,
  default_personality JSONB NOT NULL DEFAULT '{}',
  system_prompt_template TEXT NOT NULL,
  ai_provider TEXT NOT NULL DEFAULT 'anthropic',
  ai_model TEXT NOT NULL DEFAULT 'claude-sonnet-4-5-20250929',
  accent_color TEXT,
  sample_messages JSONB,
  popularity_score INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  goals TEXT[],
  preferences JSONB DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User's selected roster (max 12 enforced in app)
CREATE TABLE IF NOT EXISTS user_roster (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  intake_completed BOOLEAN DEFAULT false,
  last_interaction TIMESTAMPTZ,
  UNIQUE(user_id, coach_id)
);

-- Per-coach personality overrides
CREATE TABLE IF NOT EXISTS user_coach_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  personality_overrides JSONB DEFAULT '{}',
  notification_frequency TEXT DEFAULT 'normal',
  preferred_times JSONB,
  notes TEXT,
  UNIQUE(user_id, coach_id)
);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  conversation_type TEXT DEFAULT 'chat',
  title TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ,
  message_count INT DEFAULT 0,
  is_archived BOOLEAN DEFAULT false
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Intake session data
CREATE TABLE IF NOT EXISTS intake_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Coach memory
CREATE TABLE IF NOT EXISTS coach_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  fact TEXT NOT NULL,
  category TEXT,
  importance INT DEFAULT 5,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Scheduled touchpoints
CREATE TABLE IF NOT EXISTS touchpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  touchpoint_type TEXT NOT NULL,
  content TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Wearable data (future)
CREATE TABLE IF NOT EXISTS wearable_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  device_type TEXT,
  data_type TEXT NOT NULL,
  value JSONB NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roster ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_coach_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE touchpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_data ENABLE ROW LEVEL SECURITY;

-- Coaches are readable by all authenticated users
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coaches are viewable by authenticated users" ON coaches
  FOR SELECT TO authenticated USING (true);

-- Profile policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Roster policies
CREATE POLICY "Users can view their own roster" ON user_roster
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own roster" ON user_roster
  FOR ALL USING (auth.uid() = user_id);

-- Coach settings policies
CREATE POLICY "Users can manage their own coach settings" ON user_coach_settings
  FOR ALL USING (auth.uid() = user_id);

-- Conversation policies
CREATE POLICY "Users can manage their own conversations" ON conversations
  FOR ALL USING (auth.uid() = user_id);

-- Message policies (via conversation ownership)
CREATE POLICY "Users can manage messages in their conversations" ON messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

-- Intake data policies
CREATE POLICY "Users can manage their own intake data" ON intake_data
  FOR ALL USING (auth.uid() = user_id);

-- Coach memory policies
CREATE POLICY "Users can manage their own coach memories" ON coach_memory
  FOR ALL USING (auth.uid() = user_id);

-- Touchpoint policies
CREATE POLICY "Users can view their own touchpoints" ON touchpoints
  FOR ALL USING (auth.uid() = user_id);

-- Wearable data policies
CREATE POLICY "Users can manage their own wearable data" ON wearable_data
  FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_user_coach ON conversations(user_id, coach_id);
CREATE INDEX IF NOT EXISTS idx_touchpoints_pending ON touchpoints(user_id, status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_coach_memory_user_coach ON coach_memory(user_id, coach_id);
CREATE INDEX IF NOT EXISTS idx_user_roster_user ON user_roster(user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

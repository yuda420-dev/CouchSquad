-- CoachSquad: Encryption flags + Anonymous analytics
-- Run this in your Supabase SQL Editor

-- ── Encryption support ─────────────────────────────────────
-- Add encrypted flag to tables with sensitive content.
-- New rows will be encrypted; old rows remain plaintext (encrypted = false).

ALTER TABLE messages ADD COLUMN IF NOT EXISTS encrypted BOOLEAN DEFAULT false;
ALTER TABLE coach_memory ADD COLUMN IF NOT EXISTS encrypted BOOLEAN DEFAULT false;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS encrypted BOOLEAN DEFAULT false;
ALTER TABLE intake_data ADD COLUMN IF NOT EXISTS encrypted BOOLEAN DEFAULT false;

-- ── Anonymous analytics events ─────────────────────────────
-- Tracks aggregate platform metrics WITHOUT any user_id.
-- We can see "Coach X got 500 messages this week" but NOT who sent them.

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
  domain TEXT,
  plan_tier TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: analytics_events is service-role only (no user access)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
-- No user-facing policies — only service role can read/write

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_coach ON analytics_events(coach_id, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_domain ON analytics_events(domain, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at);

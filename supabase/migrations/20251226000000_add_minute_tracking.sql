-- Add new columns to user_subscriptions
ALTER TABLE user_subscriptions
  ADD COLUMN seconds_used INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN minutes_limit INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN current_period_start TIMESTAMPTZ,
  ADD COLUMN current_period_end TIMESTAMPTZ;

-- Create voice_sessions table
CREATE TABLE voice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  estimated_cost DECIMAL(10, 4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_voice_sessions_user_id ON voice_sessions(user_id);
CREATE INDEX idx_voice_sessions_recipe_id ON voice_sessions(recipe_id);
CREATE INDEX idx_voice_sessions_started_at ON voice_sessions(started_at);

-- Since we have no users, no data migration needed
-- Just ensure defaults are correct for new users


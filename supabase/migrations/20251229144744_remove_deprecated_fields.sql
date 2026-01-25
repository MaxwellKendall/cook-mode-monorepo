-- Remove deprecated fields from user_subscriptions table
-- Only run this after verifying token-based system works correctly

-- Verify no code references these fields before removing
-- Check: grep -r "secondsUsed\|minutesLimit\|sessionsUsed\|sessionsLimit" services/cook-mode-api/src

ALTER TABLE user_subscriptions
  DROP COLUMN IF EXISTS seconds_used,
  DROP COLUMN IF EXISTS minutes_limit,
  DROP COLUMN IF EXISTS sessions_used,
  DROP COLUMN IF EXISTS sessions_limit;

-- Verify removal
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'user_subscriptions' 
  AND column_name IN ('seconds_used', 'minutes_limit', 'sessions_used', 'sessions_limit');
-- Should return 0 rows


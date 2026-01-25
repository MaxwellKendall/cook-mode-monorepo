-- Add token tracking fields to user_subscriptions table
ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS input_tokens_used INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS output_tokens_used INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS plan VARCHAR(50) NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS incurred_cost DECIMAL(10, 6) NOT NULL DEFAULT 0.000000;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan ON user_subscriptions(plan);

-- Initialize existing rows
UPDATE user_subscriptions
SET 
  input_tokens_used = 0,
  output_tokens_used = 0,
  plan = CASE 
    WHEN minutes_limit = 10 THEN 'free'
    WHEN minutes_limit = 33 THEN 'starter'
    WHEN minutes_limit = 53 THEN 'cook'
    WHEN minutes_limit = 67 THEN 'chef'
    ELSE 'free'
  END,
  incurred_cost = 0.000000
WHERE input_tokens_used IS NULL OR output_tokens_used IS NULL OR plan IS NULL OR incurred_cost IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN user_subscriptions.input_tokens_used IS 'Total input tokens used (for display/analytics)';
COMMENT ON COLUMN user_subscriptions.output_tokens_used IS 'Total output tokens used (for display/analytics)';
COMMENT ON COLUMN user_subscriptions.plan IS 'Subscription plan: free, starter, cook, or chef (determines allowance)';
COMMENT ON COLUMN user_subscriptions.incurred_cost IS 'Actual cost incurred in dollars (for enforcement)';


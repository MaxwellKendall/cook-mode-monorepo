-- Add weekly_plans table for weekly meal planning flow
-- Supports both authenticated and anonymous users (same pattern as meal_plans/pantry)

CREATE TABLE IF NOT EXISTS public.weekly_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    anonymous_session_id VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'generating', -- 'generating' | 'active' | 'completed'
    preferences JSONB NOT NULL, -- { servings, numDinners, dietary, freeText }
    meals JSONB, -- Array of { day, recipeId, title, imageUrl, prepTime, cookTime, cookedAt }
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_weekly_plans_user_id ON public.weekly_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_status ON public.weekly_plans(status);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_created_at ON public.weekly_plans(created_at);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_anonymous_session_id ON public.weekly_plans(anonymous_session_id);

COMMENT ON TABLE public.weekly_plans IS 'Weekly meal plans generated from user preferences';
COMMENT ON COLUMN public.weekly_plans.user_id IS 'Reference to the user who owns this plan (nullable for anonymous)';
COMMENT ON COLUMN public.weekly_plans.anonymous_session_id IS 'Session ID for anonymous plan generation';
COMMENT ON COLUMN public.weekly_plans.status IS 'Plan status: generating, active, or completed';
COMMENT ON COLUMN public.weekly_plans.preferences IS 'User preferences snapshot: servings, numDinners, dietary, freeText';
COMMENT ON COLUMN public.weekly_plans.meals IS 'Array of planned meals with recipe references and cooking status';

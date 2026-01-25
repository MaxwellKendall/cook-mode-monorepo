-- Add meal plans table for storing generated meal plans
-- This migration creates the meal_plans table for tracking user meal plans with ingredients

-- Meal plans table for storing generated meal plans
CREATE TABLE IF NOT EXISTS public.meal_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active' | 'completed'
    ingredients JSONB NOT NULL, -- Array of ingredient strings
    plan JSONB NOT NULL, -- MealPlan object with recipes and schedule
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id ON public.meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_status ON public.meal_plans(status);
CREATE INDEX IF NOT EXISTS idx_meal_plans_created_at ON public.meal_plans(created_at);

-- Add comments for documentation
COMMENT ON TABLE public.meal_plans IS 'User meal plans generated from pantry ingredients';
COMMENT ON COLUMN public.meal_plans.user_id IS 'Reference to the user who owns this meal plan';
COMMENT ON COLUMN public.meal_plans.status IS 'Plan status: active (in progress) or completed';
COMMENT ON COLUMN public.meal_plans.ingredients IS 'Array of ingredient strings used for this plan';
COMMENT ON COLUMN public.meal_plans.plan IS 'Generated meal plan with recipes and schedule';
COMMENT ON COLUMN public.meal_plans.completed_at IS 'Timestamp when the plan was marked as completed';

-- Add grocery_lists and grocery_list_items tables for weekly meal plan grocery management
-- Depends on weekly_plans table (20260220000000_add_weekly_plans.sql)

CREATE TABLE IF NOT EXISTS public.grocery_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    weekly_plan_id UUID NOT NULL REFERENCES public.weekly_plans(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    anonymous_session_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grocery_lists_weekly_plan_id ON public.grocery_lists(weekly_plan_id);
CREATE INDEX IF NOT EXISTS idx_grocery_lists_user_id ON public.grocery_lists(user_id);

COMMENT ON TABLE public.grocery_lists IS 'Grocery lists generated alongside weekly meal plans';
COMMENT ON COLUMN public.grocery_lists.weekly_plan_id IS 'Reference to the weekly plan this grocery list belongs to';
COMMENT ON COLUMN public.grocery_lists.user_id IS 'Reference to the user who owns this list (nullable for anonymous)';
COMMENT ON COLUMN public.grocery_lists.anonymous_session_id IS 'Session ID for anonymous grocery list generation';

CREATE TABLE IF NOT EXISTS public.grocery_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grocery_list_id UUID NOT NULL REFERENCES public.grocery_lists(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    quantity VARCHAR(100),
    category VARCHAR(20) NOT NULL, -- 'produce' | 'meat_seafood' | 'dairy' | 'pantry' | 'frozen' | 'bakery' | 'other'
    recipe_attributions JSONB, -- [{ recipeId, title, day }]
    checked BOOLEAN NOT NULL DEFAULT FALSE,
    is_manual_add BOOLEAN NOT NULL DEFAULT FALSE,
    checked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grocery_list_items_grocery_list_id ON public.grocery_list_items(grocery_list_id);
CREATE INDEX IF NOT EXISTS idx_grocery_list_items_category ON public.grocery_list_items(category);

COMMENT ON TABLE public.grocery_list_items IS 'Individual items in a grocery list';
COMMENT ON COLUMN public.grocery_list_items.grocery_list_id IS 'Reference to the parent grocery list';
COMMENT ON COLUMN public.grocery_list_items.name IS 'Display name of the grocery item';
COMMENT ON COLUMN public.grocery_list_items.quantity IS 'Quantity with unit (e.g., "2 lbs", "1 bunch")';
COMMENT ON COLUMN public.grocery_list_items.category IS 'Aisle category: produce, meat_seafood, dairy, pantry, frozen, bakery, other';
COMMENT ON COLUMN public.grocery_list_items.recipe_attributions IS 'Array of recipes that need this item: [{ recipeId, title, day }]';
COMMENT ON COLUMN public.grocery_list_items.checked IS 'Whether the item has been checked off';
COMMENT ON COLUMN public.grocery_list_items.is_manual_add IS 'Whether the item was manually added by the user';
COMMENT ON COLUMN public.grocery_list_items.checked_at IS 'Timestamp when the item was checked off';

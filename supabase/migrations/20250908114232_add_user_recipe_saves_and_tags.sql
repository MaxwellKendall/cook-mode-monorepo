-- Add user recipe saves and tags functionality
-- This migration creates tables for users to save recipes and add custom tags

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User recipe saves (junction table for users saving recipes)
CREATE TABLE IF NOT EXISTS public.user_recipe_saves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT, -- Optional user notes about the saved recipe
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Ensure a user can only save a recipe once
    UNIQUE(user_id, recipe_id)
);

-- User tags (custom tags that users can create and apply to their saved recipes)
CREATE TABLE IF NOT EXISTS public.user_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7), -- Hex color code for UI (e.g., #FF5733)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure tag names are unique per user
    UNIQUE(user_id, name)
);

-- User recipe tags (junction table for applying user tags to saved recipes)
-- Many-to-many relationship: one recipe can have many tags, one tag can be applied to many recipes
CREATE TABLE IF NOT EXISTS public.user_recipe_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.user_tags(id) ON DELETE CASCADE,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure a user can only apply a specific tag to a recipe once
    UNIQUE(user_id, recipe_id, tag_id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_recipe_saves_user_id ON public.user_recipe_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recipe_saves_recipe_id ON public.user_recipe_saves(recipe_id);
CREATE INDEX IF NOT EXISTS idx_user_recipe_saves_saved_at ON public.user_recipe_saves(saved_at);
CREATE INDEX IF NOT EXISTS idx_user_recipe_saves_favorite ON public.user_recipe_saves(is_favorite) WHERE is_favorite = TRUE;

CREATE INDEX IF NOT EXISTS idx_user_tags_user_id ON public.user_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tags_name ON public.user_tags(name);

CREATE INDEX IF NOT EXISTS idx_user_recipe_tags_user_id ON public.user_recipe_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recipe_tags_recipe_id ON public.user_recipe_tags(recipe_id);
CREATE INDEX IF NOT EXISTS idx_user_recipe_tags_tag_id ON public.user_recipe_tags(tag_id);

-- Add comments for documentation
COMMENT ON TABLE public.users IS 'User accounts with basic profile information';
COMMENT ON TABLE public.user_recipe_saves IS 'Junction table for users saving recipes with optional notes and favorite status';
COMMENT ON TABLE public.user_tags IS 'Custom tags created by users for organizing their saved recipes';
COMMENT ON TABLE public.user_recipe_tags IS 'Junction table for applying user-created tags to saved recipes';

COMMENT ON COLUMN public.user_recipe_saves.notes IS 'Optional user notes about why they saved this recipe';
COMMENT ON COLUMN public.user_recipe_saves.is_favorite IS 'Whether this recipe is marked as a favorite by the user';
COMMENT ON COLUMN public.user_tags.color IS 'Hex color code for UI display (e.g., #FF5733)';

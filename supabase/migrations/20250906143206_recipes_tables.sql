-- Migration: Create recipes tables structure
-- This migration creates all tables needed for the recipe system
-- Based on the types defined in services/migrations/src/types/recipes.ts

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create lookup tables first (referenced by main tables)

-- Cuisines lookup table
CREATE TABLE IF NOT EXISTS public.cuisines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories lookup table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cooking tools lookup table
CREATE TABLE IF NOT EXISTS public.cooking_tools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Keywords lookup table
CREATE TABLE IF NOT EXISTS public.keywords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    keyword VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Main recipes table
CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mongo_id VARCHAR(255) NOT NULL UNIQUE, -- Original MongoDB _id for reference
    title VARCHAR(255) NOT NULL,
    original_title VARCHAR(255),
    link TEXT NOT NULL,
    source VARCHAR(255) NOT NULL,
    ingredients TEXT NOT NULL,
    servings VARCHAR(50),
    prep_time VARCHAR(50), -- ISO 8601 duration format
    cook_time VARCHAR(50), -- ISO 8601 duration format
    summary TEXT,
    original_summary TEXT,
    image_url TEXT,
    qualification_method VARCHAR(100),
    qualified BOOLEAN NOT NULL DEFAULT FALSE,
    level_of_effort INTEGER CHECK (level_of_effort >= 1 AND level_of_effort <= 5),
    rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
    rating_count INTEGER NOT NULL DEFAULT 0,
    vector_embedded BOOLEAN NOT NULL DEFAULT FALSE,
    vector_id VARCHAR(255),
    newsletter_edition VARCHAR(100),
    embedding_prompt TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recipe instructions table
CREATE TABLE IF NOT EXISTS public.recipe_instructions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    instruction TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(recipe_id, step_number)
);

-- Recipe nutrients table
CREATE TABLE IF NOT EXISTS public.recipe_nutrients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    calories VARCHAR(50),
    carbohydrate_content VARCHAR(50),
    cholesterol_content VARCHAR(50),
    fiber_content VARCHAR(50),
    protein_content VARCHAR(50),
    saturated_fat_content VARCHAR(50),
    sodium_content VARCHAR(50),
    sugar_content VARCHAR(50),
    fat_content VARCHAR(50),
    unsaturated_fat_content VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(recipe_id) -- One nutrients record per recipe
);

-- Recipe relevance table
CREATE TABLE IF NOT EXISTS public.recipe_relevance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    family_score DECIMAL(5,2),
    single_score DECIMAL(5,2),
    health_score DECIMAL(5,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(recipe_id) -- One relevance record per recipe
);

-- Junction tables for many-to-many relationships

-- Recipe cuisines junction table
CREATE TABLE IF NOT EXISTS public.recipe_cuisines (
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    cuisine_id UUID NOT NULL REFERENCES public.cuisines(id) ON DELETE CASCADE,
    PRIMARY KEY (recipe_id, cuisine_id)
);

-- Recipe categories junction table
CREATE TABLE IF NOT EXISTS public.recipe_categories (
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    PRIMARY KEY (recipe_id, category_id)
);

-- Recipe tools junction table
CREATE TABLE IF NOT EXISTS public.recipe_tools (
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    tool_id UUID NOT NULL REFERENCES public.cooking_tools(id) ON DELETE CASCADE,
    PRIMARY KEY (recipe_id, tool_id)
);

-- Recipe keywords junction table
CREATE TABLE IF NOT EXISTS public.recipe_keywords (
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    keyword_id UUID NOT NULL REFERENCES public.keywords(id) ON DELETE CASCADE,
    PRIMARY KEY (recipe_id, keyword_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recipes_mongo_id ON public.recipes(mongo_id);
CREATE INDEX IF NOT EXISTS idx_recipes_title ON public.recipes(title);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON public.recipes(created_at);
CREATE INDEX IF NOT EXISTS idx_recipes_rating ON public.recipes(rating);
CREATE INDEX IF NOT EXISTS idx_recipes_vector_embedded ON public.recipes(vector_embedded);

CREATE INDEX IF NOT EXISTS idx_recipe_instructions_recipe_id ON public.recipe_instructions(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_nutrients_recipe_id ON public.recipe_nutrients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_relevance_recipe_id ON public.recipe_relevance(recipe_id);

CREATE INDEX IF NOT EXISTS idx_recipe_cuisines_recipe_id ON public.recipe_cuisines(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_cuisines_cuisine_id ON public.recipe_cuisines(cuisine_id);
CREATE INDEX IF NOT EXISTS idx_recipe_categories_recipe_id ON public.recipe_categories(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_categories_category_id ON public.recipe_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_recipe_tools_recipe_id ON public.recipe_tools(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_tools_tool_id ON public.recipe_tools(tool_id);
CREATE INDEX IF NOT EXISTS idx_recipe_keywords_recipe_id ON public.recipe_keywords(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_keywords_keyword_id ON public.recipe_keywords(keyword_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for recipes table to automatically update updated_at
CREATE TRIGGER update_recipes_updated_at 
    BEFORE UPDATE ON public.recipes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.recipes IS 'Main recipes table storing recipe information';
COMMENT ON TABLE public.cuisines IS 'Lookup table for cuisine types';
COMMENT ON TABLE public.categories IS 'Lookup table for recipe categories';
COMMENT ON TABLE public.cooking_tools IS 'Lookup table for cooking tools and equipment';
COMMENT ON TABLE public.keywords IS 'Lookup table for recipe keywords';
COMMENT ON TABLE public.recipe_instructions IS 'Step-by-step instructions for recipes';
COMMENT ON TABLE public.recipe_nutrients IS 'Nutritional information for recipes';
COMMENT ON TABLE public.recipe_relevance IS 'Relevance scores for different contexts';
COMMENT ON TABLE public.recipe_cuisines IS 'Many-to-many relationship between recipes and cuisines';
COMMENT ON TABLE public.recipe_categories IS 'Many-to-many relationship between recipes and categories';
COMMENT ON TABLE public.recipe_tools IS 'Many-to-many relationship between recipes and cooking tools';
COMMENT ON TABLE public.recipe_keywords IS 'Many-to-many relationship between recipes and keywords';

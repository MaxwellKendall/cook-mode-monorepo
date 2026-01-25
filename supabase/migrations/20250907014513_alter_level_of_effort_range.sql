-- Alter level_of_effort column constraint to accept integers 1-10 inclusive
-- This migration updates the CHECK constraint on the level_of_effort column
-- from the previous range of 1-5 to the new range of 1-10

-- First, drop the existing constraint
ALTER TABLE public.recipes 
DROP CONSTRAINT IF EXISTS recipes_level_of_effort_check;

-- Add the new constraint with the expanded range (1-10 inclusive)
ALTER TABLE public.recipes 
ADD CONSTRAINT recipes_level_of_effort_check 
CHECK (level_of_effort >= 1 AND level_of_effort <= 10);

-- Add a comment to document the change
COMMENT ON COLUMN public.recipes.level_of_effort IS 'Difficulty level from 1 (easiest) to 10 (most difficult)';

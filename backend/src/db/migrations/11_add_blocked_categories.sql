-- 11. Add blocked_categories to content_filters
ALTER TABLE public.content_filters 
ADD COLUMN IF NOT EXISTS blocked_categories TEXT[] DEFAULT '{}';

-- Optional: If we want to support 'tweens'/'teens' in children table check constraint, we need to alter it.
-- Dropping constraint and re-adding is standard way.
ALTER TABLE public.children DROP CONSTRAINT IF EXISTS children_age_appropriate_level_check;
ALTER TABLE public.children ADD CONSTRAINT children_age_appropriate_level_check 
CHECK (age_appropriate_level IN ('preschool', 'early-elementary', 'elementary', 'tweens', 'teens'));

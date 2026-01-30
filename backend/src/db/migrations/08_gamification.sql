-- Gamification Features: Stars & Badges

-- Add stars columns to children table
ALTER TABLE children 
ADD COLUMN IF NOT EXISTS stars INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_stars_earned INTEGER DEFAULT 0;

-- Create Badges Table (Optional, for dynamic badges)
-- For now, we might define badges in code, but tracking *earned* badges needs a table.

CREATE TABLE IF NOT EXISTS child_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID REFERENCES children(id) ON DELETE CASCADE NOT NULL,
    badge_id TEXT NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb, -- Store extra info like "streak days: 7"
    UNIQUE(child_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_child_badges_child_id ON child_badges(child_id);

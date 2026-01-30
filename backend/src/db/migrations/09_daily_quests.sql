-- Daily Quests Table
CREATE TABLE IF NOT EXISTS daily_quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    child_id UUID REFERENCES children (id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    type TEXT NOT NULL, -- 'watch_time', 'stars_earned', 'videos_watched'
    target INTEGER NOT NULL,
    progress INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    reward_stars INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW ()
);

CREATE INDEX IF NOT EXISTS idx_daily_quests_child_date ON daily_quests (child_id, date);
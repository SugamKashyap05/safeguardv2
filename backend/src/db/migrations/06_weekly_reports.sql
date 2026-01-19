-- Create weekly_reports table
CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  summary JSONB DEFAULT '{}'::jsonb, -- totalWatchTime, totalVideos, etc.
  children_reports JSONB DEFAULT '[]'::jsonb, -- Array of detailed child stats
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_viewed BOOLEAN DEFAULT false,
  
  UNIQUE(parent_id, week_start_date)
);

CREATE INDEX IF NOT EXISTS idx_weekly_reports_parent_id ON weekly_reports(parent_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_week_start ON weekly_reports(week_start_date);

-- RLS
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view their own reports" 
ON weekly_reports FOR SELECT 
USING (parent_id = auth.uid());

CREATE POLICY "System can insert reports" 
ON weekly_reports FOR INSERT 
WITH CHECK (true); -- Usually restricted to service role, but for MVP/RLS relying on authenticated backend logic or trigger

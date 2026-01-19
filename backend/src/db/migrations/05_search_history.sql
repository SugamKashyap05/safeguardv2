-- Create search_history table
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  clicked_video_id TEXT,
  is_voice_search BOOLEAN DEFAULT FALSE,
  is_flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster history retrieval
CREATE INDEX IF NOT EXISTS idx_search_history_child_id ON search_history(child_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at);

-- RLS Policies
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view their children's search history" 
ON search_history FOR SELECT 
USING (
  exists (
    select 1 from children 
    where children.id = search_history.child_id 
    and children.parent_id = auth.uid()
  )
);

CREATE POLICY "Children can insert their own searches" 
ON search_history FOR INSERT 
WITH CHECK (
  child_id = (current_setting('app.current_child_id', true)::uuid) 
  OR 
  exists (
    select 1 from children 
    where children.id = search_history.child_id 
    and children.parent_id = auth.uid()
  ) 
  OR
  true -- Allow backend service role to insert freely if using service key
);

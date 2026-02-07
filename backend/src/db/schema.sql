-- SAFE DROP & RECREATE: Parental Controls Schema
-- WARNING: This will DROP existing objects (tables, triggers, functions) related to the parental controls schema.
-- Run only if you intend to destroy existing data in these tables.

-- 0. Drop triggers (if exist)
DROP TRIGGER IF EXISTS update_parents_updated_at ON public.parents;
DROP TRIGGER IF EXISTS update_children_updated_at ON public.children;
DROP TRIGGER IF EXISTS update_screen_time_rules_updated_at ON public.screen_time_rules;
DROP TRIGGER IF EXISTS trigger_set_age_appropriate_level ON public.children;
DROP TRIGGER IF EXISTS enforce_child_limit_on_insert ON public.children;

-- 1. Drop functions (if exist)
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.set_age_appropriate_level() CASCADE;
DROP FUNCTION IF EXISTS public.enforce_child_limit_on_insert() CASCADE;
DROP FUNCTION IF EXISTS public.check_child_limit(UUID) CASCADE;

-- 2. Drop tables (if exist) in order to respect FK dependencies
DROP TABLE IF EXISTS public.approval_requests CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.screen_time_rules CASCADE;
DROP TABLE IF EXISTS public.blocked_content CASCADE;
DROP TABLE IF EXISTS public.approved_channels CASCADE;
DROP TABLE IF EXISTS public.watch_history CASCADE;
DROP TABLE IF EXISTS public.children CASCADE;
DROP TABLE IF EXISTS public.parents CASCADE;

-- 3. Recreate extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 4. Parents Table (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.parents (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone_number TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'family')),
  is_active BOOLEAN DEFAULT true,
  notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}'::jsonb,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;

CREATE POLICY parents_select_own ON public.parents
  FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

CREATE POLICY parents_update_own ON public.parents
  FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()));

CREATE POLICY parents_insert_self ON public.parents
  FOR INSERT
  TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

-- 5. Children Table
CREATE TABLE IF NOT EXISTS public.children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 3 AND age <= 10),
  avatar TEXT,
  pin_hash TEXT NOT NULL,
  age_appropriate_level TEXT NOT NULL CHECK (age_appropriate_level IN ('preschool', 'early-elementary', 'elementary', 'tweens', 'teens')),
  preferences JSONB DEFAULT '{"favoriteCategories": [], "favoriteChannels": []}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  paused_until TIMESTAMP WITH TIME ZONE,
  pause_reason TEXT,
  stars INTEGER DEFAULT 0,
  total_stars_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_pin_per_parent UNIQUE(parent_id, pin_hash)
);

CREATE INDEX IF NOT EXISTS idx_children_parent_id ON public.children(parent_id);
CREATE INDEX IF NOT EXISTS idx_children_age ON public.children(age);
CREATE INDEX IF NOT EXISTS idx_children_parent_name ON public.children(parent_id, name);
-- Optional index for active children queries
CREATE INDEX IF NOT EXISTS idx_children_parent_active ON public.children(parent_id, is_active);

ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

CREATE POLICY children_select_for_parent ON public.children
  FOR SELECT
  TO authenticated
  USING (parent_id = (SELECT auth.uid()));

CREATE POLICY children_insert_for_parent ON public.children
  FOR INSERT
  TO authenticated
  WITH CHECK (parent_id = (SELECT auth.uid()));

CREATE POLICY children_update_for_parent ON public.children
  FOR UPDATE
  TO authenticated
  USING (parent_id = (SELECT auth.uid()))
  WITH CHECK (parent_id = (SELECT auth.uid()));

CREATE POLICY children_delete_for_parent ON public.children
  FOR DELETE
  TO authenticated
  USING (parent_id = (SELECT auth.uid()));

-- 6. Watch History
CREATE TABLE IF NOT EXISTS public.watch_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  video_title TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  thumbnail TEXT,
  duration INTEGER,
  watched_duration INTEGER,
  watch_percentage INTEGER,
  completed_watch BOOLEAN DEFAULT false,
  category TEXT,
  was_blocked BOOLEAN DEFAULT false,
  block_reason TEXT,
  watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_watch_history_child_id ON public.watch_history(child_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_watched_at ON public.watch_history(watched_at);

ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY watch_history_select_parent ON public.watch_history
  FOR SELECT
  TO authenticated
  USING (
    child_id IN (
      SELECT id FROM public.children WHERE parent_id = (SELECT auth.uid())
    )
  );

CREATE POLICY watch_history_insert_parent ON public.watch_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    child_id IN (
      SELECT id FROM public.children WHERE parent_id = (SELECT auth.uid())
    )
  );

-- 7. Approved Channels
CREATE TABLE IF NOT EXISTS public.approved_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  channel_thumbnail TEXT,
  approved_by UUID NOT NULL REFERENCES public.parents(id),
  approved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  auto_approved BOOLEAN DEFAULT false,
  notes TEXT,
  UNIQUE(child_id, channel_id)
);

CREATE INDEX IF NOT EXISTS idx_approved_channels_child_id ON public.approved_channels(child_id);

ALTER TABLE public.approved_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY approved_channels_parent ON public.approved_channels
  FOR ALL
  TO authenticated
  USING (
    child_id IN (
      SELECT id FROM public.children WHERE parent_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    child_id IN (
      SELECT id FROM public.children WHERE parent_id = (SELECT auth.uid())
    )
  );

-- 8. Blocked Content
CREATE TABLE IF NOT EXISTS public.blocked_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  video_id TEXT,
  channel_id TEXT,
  blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT,
  is_emergency BOOLEAN DEFAULT false,
  CONSTRAINT check_content_type CHECK (
    (video_id IS NOT NULL AND channel_id IS NULL) OR
    (video_id IS NULL AND channel_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_blocked_content_child_id ON public.blocked_content(child_id);

ALTER TABLE public.blocked_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY blocked_content_parent ON public.blocked_content
  FOR ALL
  TO authenticated
  USING (
    child_id IN (
      SELECT id FROM public.children WHERE parent_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    child_id IN (
      SELECT id FROM public.children WHERE parent_id = (SELECT auth.uid())
    )
  );

-- 9. Screen Time Rules
CREATE TABLE IF NOT EXISTS public.screen_time_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID UNIQUE NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  daily_limit_minutes INTEGER DEFAULT 60,
  weekday_limit_minutes INTEGER,
  weekend_limit_minutes INTEGER,
  allowed_time_windows JSONB DEFAULT '[]'::jsonb,
  bedtime_mode JSONB DEFAULT '{"enabled": false}'::jsonb,
  break_reminder_enabled BOOLEAN DEFAULT true,
  break_reminder_interval INTEGER DEFAULT 30,
  today_usage_minutes INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_screen_time_child_id ON public.screen_time_rules(child_id);

ALTER TABLE public.screen_time_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY screen_time_rules_parent ON public.screen_time_rules
  FOR ALL
  TO authenticated
  USING (
    child_id IN (
      SELECT id FROM public.children WHERE parent_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    child_id IN (
      SELECT id FROM public.children WHERE parent_id = (SELECT auth.uid())
    )
  );

-- 10. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_parent_id ON public.notifications(parent_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_parent ON public.notifications
  FOR ALL
  TO authenticated
  USING (parent_id = (SELECT auth.uid()))
  WITH CHECK (parent_id = (SELECT auth.uid()));

-- 11. Approval Requests
CREATE TABLE IF NOT EXISTS public.approval_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('video', 'channel')),
  video_id TEXT,
  video_title TEXT,
  video_thumbnail TEXT,
  channel_id TEXT,
  channel_name TEXT,
  channel_thumbnail TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES public.parents(id),
  parent_notes TEXT,
  child_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_approval_requests_child_id ON public.approval_requests(child_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON public.approval_requests(status);

ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY approval_requests_parent ON public.approval_requests
  FOR ALL
  TO authenticated
  USING (
    child_id IN (
      SELECT id FROM public.children WHERE parent_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    child_id IN (
      SELECT id FROM public.children WHERE parent_id = (SELECT auth.uid())
    )
  );

-- 12. Helper: check_child_limit
CREATE OR REPLACE FUNCTION public.check_child_limit(p_parent_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier TEXT;
  v_child_count INTEGER;
  v_max_children INTEGER;
BEGIN
  SELECT subscription_tier INTO v_tier
    FROM public.parents
    WHERE id = p_parent_id;

  SELECT COUNT(*) INTO v_child_count
    FROM public.children
    WHERE parent_id = p_parent_id AND is_active = true;

  v_max_children := CASE v_tier
    WHEN 'free' THEN 2
    WHEN 'premium' THEN 5
    WHEN 'family' THEN 10
    ELSE 2
  END;

  RETURN v_child_count < v_max_children;
END;
$$ LANGUAGE plpgsql STABLE;

REVOKE EXECUTE ON FUNCTION public.check_child_limit(UUID) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_child_limit(UUID) TO service_role;

-- 13. Trigger: set_age_appropriate_level
CREATE OR REPLACE FUNCTION public.set_age_appropriate_level()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.age IS NOT NULL THEN
    IF NEW.age >= 3 AND NEW.age <= 5 THEN
      NEW.age_appropriate_level := 'preschool';
    ELSIF NEW.age >= 6 AND NEW.age <= 7 THEN
      NEW.age_appropriate_level := 'early-elementary';
    ELSIF NEW.age >= 8 AND NEW.age <= 10 THEN
      NEW.age_appropriate_level := 'elementary';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_age_appropriate_level
  BEFORE INSERT OR UPDATE OF age ON public.children
  FOR EACH ROW
  EXECUTE FUNCTION public.set_age_appropriate_level();

-- 14. Trigger: update_updated_at_column (generic)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_parents_updated_at
  BEFORE UPDATE ON public.parents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_children_updated_at
  BEFORE UPDATE ON public.children
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_screen_time_rules_updated_at
  BEFORE UPDATE ON public.screen_time_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 15. Optional: Enforce child limit at insert time (example trigger)
CREATE OR REPLACE FUNCTION public.enforce_child_limit_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.check_child_limit(NEW.parent_id) THEN
    RAISE EXCEPTION 'Parent % has reached the maximum number of active children for their subscription.', NEW.parent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_child_limit_on_insert
  BEFORE INSERT ON public.children
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_child_limit_on_insert();

-- 16. Child Sessions Table
CREATE TABLE IF NOT EXISTS public.child_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_child_sessions_child_id ON public.child_sessions(child_id);
CREATE INDEX IF NOT EXISTS idx_child_sessions_token_hash ON public.child_sessions(token_hash);

ALTER TABLE public.child_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY child_sessions_parent_policy ON public.child_sessions
  FOR ALL
  TO authenticated
  USING (
    child_id IN (
      SELECT id FROM public.children WHERE parent_id = (SELECT auth.uid())
    )
  );

-- 17. Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.parents(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_child_id ON public.activity_logs(child_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON public.activity_logs(type);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY activity_logs_parent_policy ON public.activity_logs
  FOR ALL
  TO authenticated
  USING (
    (parent_id = (SELECT auth.uid())) OR
    (child_id IN (
      SELECT id FROM public.children WHERE parent_id = (SELECT auth.uid())
    ))
  );

-- 18. Content Filters
CREATE TABLE IF NOT EXISTS public.content_filters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID UNIQUE NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  blocked_keywords TEXT[] DEFAULT '{}',
  blocked_categories TEXT[] DEFAULT '{}',
  allowed_categories TEXT[] DEFAULT '{}',
  max_video_duration_minutes INTEGER DEFAULT 15,
  allow_comments BOOLEAN DEFAULT false,
  strict_mode BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_filters_child_id ON public.content_filters(child_id);

ALTER TABLE public.content_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY content_filters_parent ON public.content_filters
  FOR ALL
  TO authenticated
  USING (
    child_id IN (
      SELECT id FROM public.children WHERE parent_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    child_id IN (
      SELECT id FROM public.children WHERE parent_id = (SELECT auth.uid())
    )
  );

-- 19. Approved Videos
CREATE TABLE IF NOT EXISTS public.approved_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  video_title TEXT NOT NULL,
  video_thumbnail TEXT,
  approved_by UUID NOT NULL REFERENCES public.parents(id),
  approved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  UNIQUE(child_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_approved_videos_child_id ON public.approved_videos(child_id);

ALTER TABLE public.approved_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY approved_videos_parent ON public.approved_videos
  FOR ALL
  TO authenticated
  USING (
    child_id IN (
      SELECT id FROM public.children WHERE parent_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    child_id IN (
      SELECT id FROM public.children WHERE parent_id = (SELECT auth.uid())
    )
  );

-- End of SAFE DROP & RECREATE script

-- 20. Weekly Reports
CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  summary JSONB DEFAULT '{}'::jsonb,
  children_reports JSONB DEFAULT '[]'::jsonb,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_viewed BOOLEAN DEFAULT false,
  UNIQUE(parent_id, week_start_date)
);

CREATE INDEX IF NOT EXISTS idx_weekly_reports_parent_id ON weekly_reports(parent_id);

-- 21. Devices Table
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL, -- Unique hardware/local ID
    device_name VARCHAR(255) NOT NULL,
    device_type VARCHAR(50) DEFAULT 'unknown', -- mobile, tablet, desktop, tv
    platform VARCHAR(50), -- iOS, Android, Web
    push_token TEXT,
    is_active BOOLEAN DEFAULT true,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(child_id, device_id)
);

-- 22. Session Sync Table
CREATE TABLE IF NOT EXISTS session_sync (
    child_id UUID PRIMARY KEY REFERENCES children(id) ON DELETE CASCADE,
    video_id VARCHAR(255),
    position INTEGER DEFAULT 0, -- in seconds
    device_id VARCHAR(255), -- ID of device where session started
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    watch_queue TEXT[] DEFAULT '{}', -- Array of video IDs
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 23. Playlists Table
CREATE TABLE IF NOT EXISTS public.playlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('favorites', 'watch_later', 'custom')),
  is_default BOOLEAN DEFAULT false,
  thumbnail TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_playlists_child_id ON public.playlists(child_id);

ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY playlists_child_policy ON public.playlists
  FOR ALL
  TO authenticated
  USING (
    child_id IN (
      SELECT id FROM public.children WHERE parent_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    child_id IN (
      SELECT id FROM public.children WHERE parent_id = (SELECT auth.uid())
    )
  );

-- 24. Playlist Items Table
CREATE TABLE IF NOT EXISTS public.playlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  video_metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(playlist_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist_id ON public.playlist_items(playlist_id);

ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY playlist_items_policy ON public.playlist_items
  FOR ALL
  TO authenticated
  USING (
    playlist_id IN (
      SELECT id FROM public.playlists WHERE child_id IN (
        SELECT id FROM public.children WHERE parent_id = (SELECT auth.uid())
      )
    )
  )
  WITH CHECK (
    playlist_items.playlist_id IN (
      SELECT id FROM public.playlists WHERE child_id IN (
        SELECT id FROM public.children WHERE parent_id = (SELECT auth.uid())
      )
    )
  );


-- 25. Gamification: Child Badges
CREATE TABLE IF NOT EXISTS public.child_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(child_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_child_badges_child_id ON public.child_badges(child_id);

ALTER TABLE public.child_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY child_badges_select_parent ON public.child_badges
  FOR SELECT
  TO authenticated
  USING (
    child_id IN (
      SELECT id FROM public.children WHERE parent_id = (SELECT auth.uid())
    )
  );

CREATE POLICY child_badges_insert_system ON public.child_badges
  FOR INSERT
  TO authenticated
  WITH CHECK (
    child_id IN (
      SELECT id FROM public.children WHERE parent_id = (SELECT auth.uid())
    )
  );

-- 26. Search History
CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  clicked_video_id TEXT,
  is_voice_search BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_history_child_id ON public.search_history(child_id);

ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY search_history_parent_policy ON public.search_history
  FOR ALL
  TO authenticated
  USING (
    child_id IN (
      SELECT id FROM public.children WHERE parent_id = (SELECT auth.uid())
    )
  );

-- 27. Daily Quests
CREATE TABLE IF NOT EXISTS public.daily_quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  type TEXT NOT NULL,
  target INTEGER NOT NULL,
  progress INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  reward_stars INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_quests_child_id ON public.daily_quests(child_id);

ALTER TABLE public.daily_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY daily_quests_parent_policy ON public.daily_quests
  FOR ALL
  TO authenticated
  USING (
    child_id IN (
      SELECT id FROM public.children WHERE parent_id = (SELECT auth.uid())
    )
  );

-- 28. Child Inventory
CREATE TABLE IF NOT EXISTS public.child_inventory (
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT child_inventory_pkey PRIMARY KEY (child_id, item_id)
);

ALTER TABLE public.child_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY child_inventory_parent_policy ON public.child_inventory
  FOR ALL
  TO authenticated
  USING (
    child_id IN (
      SELECT id FROM public.children WHERE parent_id = (SELECT auth.uid())
    )
  );

-- 29. Child Notifications
CREATE TABLE IF NOT EXISTS public.child_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT,
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_child_notifications_child_id ON public.child_notifications(child_id);

ALTER TABLE public.child_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY child_notifications_parent_policy ON public.child_notifications
  FOR ALL
  TO authenticated
  USING (
    child_id IN (
      SELECT id FROM public.children WHERE parent_id = (SELECT auth.uid())
    )
  );

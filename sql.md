-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.activity_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  child_id uuid,
  parent_id uuid,
  type text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  timestamp timestamp with time zone DEFAULT now(),
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT activity_logs_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(id),
  CONSTRAINT activity_logs_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.parents(id)
);
CREATE TABLE public.approval_requests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  child_id uuid NOT NULL,
  request_type text NOT NULL CHECK (request_type = ANY (ARRAY['video'::text, 'channel'::text])),
  video_id text,
  video_title text,
  video_thumbnail text,
  channel_id text,
  channel_name text,
  channel_thumbnail text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  requested_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  parent_notes text,
  child_message text,
  channel_thumbnail_url text,
  notes text,
  parent_id uuid,
  CONSTRAINT approval_requests_pkey PRIMARY KEY (id),
  CONSTRAINT approval_requests_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(id),
  CONSTRAINT approval_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.parents(id),
  CONSTRAINT approval_requests_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.parents(id)
);
CREATE TABLE public.approved_channels (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  child_id uuid NOT NULL,
  channel_id text NOT NULL,
  channel_name text NOT NULL,
  channel_thumbnail text,
  approved_by uuid NOT NULL,
  approved_at timestamp with time zone DEFAULT now(),
  auto_approved boolean DEFAULT false,
  notes text,
  channel_thumbnail_url text,
  CONSTRAINT approved_channels_pkey PRIMARY KEY (id),
  CONSTRAINT approved_channels_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(id),
  CONSTRAINT approved_channels_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.parents(id)
);
CREATE TABLE public.approved_videos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL,
  video_id text NOT NULL,
  approved_by uuid,
  approved_at timestamp with time zone DEFAULT now(),
  CONSTRAINT approved_videos_pkey PRIMARY KEY (id),
  CONSTRAINT approved_videos_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(id),
  CONSTRAINT approved_videos_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.parents(id)
);
CREATE TABLE public.blocked_content (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  child_id uuid NOT NULL,
  video_id text,
  channel_id text,
  blocked_at timestamp with time zone DEFAULT now(),
  reason text,
  is_emergency boolean DEFAULT false,
  CONSTRAINT blocked_content_pkey PRIMARY KEY (id),
  CONSTRAINT blocked_content_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(id)
);
CREATE TABLE public.child_badges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL,
  badge_id text NOT NULL,
  earned_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT child_badges_pkey PRIMARY KEY (id),
  CONSTRAINT child_badges_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(id)
);
CREATE TABLE public.child_inventory (
  child_id uuid NOT NULL,
  item_id text NOT NULL,
  item_type text NOT NULL,
  acquired_at timestamp with time zone DEFAULT now(),
  CONSTRAINT child_inventory_pkey PRIMARY KEY (child_id, item_id),
  CONSTRAINT child_inventory_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(id)
);
CREATE TABLE public.child_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL,
  type text NOT NULL,
  title text,
  message text,
  data jsonb,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT child_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT child_notifications_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(id)
);
CREATE TABLE public.child_sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  child_id uuid NOT NULL,
  token_hash text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT child_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT child_sessions_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(id)
);
CREATE TABLE public.children (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  parent_id uuid NOT NULL,
  name text NOT NULL,
  age integer NOT NULL CHECK (age >= 3 AND age <= 10),
  avatar text,
  pin_hash text NOT NULL,
  age_appropriate_level text NOT NULL CHECK (age_appropriate_level = ANY (ARRAY['preschool'::text, 'early-elementary'::text, 'elementary'::text, 'tweens'::text, 'teens'::text])),
  preferences jsonb DEFAULT '{"favoriteChannels": [], "favoriteCategories": []}'::jsonb,
  is_active boolean DEFAULT true,
  paused_until timestamp with time zone,
  pause_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  failed_pin_attempts integer DEFAULT 0,
  lockout_until timestamp with time zone,
  stars integer DEFAULT 0,
  total_stars_earned integer DEFAULT 0,
  avatar_config jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT children_pkey PRIMARY KEY (id),
  CONSTRAINT children_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.parents(id)
);
CREATE TABLE public.content_filters (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  child_id uuid NOT NULL UNIQUE,
  blocked_keywords ARRAY DEFAULT '{}'::text[],
  allowed_categories ARRAY DEFAULT '{}'::text[],
  max_video_duration_minutes integer DEFAULT 15,
  allow_comments boolean DEFAULT false,
  strict_mode boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  blocked_categories ARRAY DEFAULT '{}'::text[],
  CONSTRAINT content_filters_pkey PRIMARY KEY (id),
  CONSTRAINT content_filters_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(id)
);
CREATE TABLE public.daily_quests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  child_id uuid,
  date date DEFAULT CURRENT_DATE,
  type text NOT NULL,
  target integer NOT NULL,
  progress integer DEFAULT 0,
  is_completed boolean DEFAULT false,
  reward_stars integer DEFAULT 5,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT daily_quests_pkey PRIMARY KEY (id),
  CONSTRAINT daily_quests_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(id)
);
CREATE TABLE public.devices (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  child_id uuid,
  device_id character varying NOT NULL,
  device_name character varying NOT NULL,
  device_type character varying DEFAULT 'unknown'::character varying,
  platform character varying,
  push_token text,
  is_active boolean DEFAULT true,
  last_active timestamp with time zone DEFAULT now(),
  registered_at timestamp with time zone DEFAULT now(),
  is_paused boolean DEFAULT false,
  CONSTRAINT devices_pkey PRIMARY KEY (id),
  CONSTRAINT devices_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  parent_id uuid NOT NULL,
  child_id uuid,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  priority text DEFAULT 'medium'::text CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])),
  data jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  action_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.parents(id),
  CONSTRAINT notifications_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(id)
);
CREATE TABLE public.parents (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  phone_number text,
  subscription_tier text DEFAULT 'free'::text CHECK (subscription_tier = ANY (ARRAY['free'::text, 'premium'::text, 'family'::text])),
  is_active boolean DEFAULT true,
  notification_preferences jsonb DEFAULT '{"sms": false, "push": true, "email": true}'::jsonb,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  onboarding_step integer DEFAULT 0,
  is_email_verified boolean DEFAULT false,
  verification_token text,
  CONSTRAINT parents_pkey PRIMARY KEY (id),
  CONSTRAINT parents_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.playlist_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  playlist_id uuid,
  video_id text NOT NULL,
  position integer NOT NULL,
  video_metadata jsonb DEFAULT '{}'::jsonb,
  added_at timestamp with time zone DEFAULT now(),
  CONSTRAINT playlist_items_pkey PRIMARY KEY (id),
  CONSTRAINT playlist_items_playlist_id_fkey FOREIGN KEY (playlist_id) REFERENCES public.playlists(id)
);
CREATE TABLE public.playlists (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  child_id uuid,
  name text NOT NULL,
  description text,
  type text CHECK (type = ANY (ARRAY['favorites'::text, 'watch_later'::text, 'custom'::text])),
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT playlists_pkey PRIMARY KEY (id),
  CONSTRAINT playlists_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(id)
);
CREATE TABLE public.screen_time_rules (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  child_id uuid NOT NULL UNIQUE,
  daily_limit_minutes integer DEFAULT 60,
  weekday_limit_minutes integer,
  weekend_limit_minutes integer,
  allowed_time_windows jsonb DEFAULT '[]'::jsonb,
  bedtime_mode jsonb DEFAULT '{"enabled": false}'::jsonb,
  break_reminder_enabled boolean DEFAULT true,
  break_reminder_interval integer DEFAULT 30,
  today_usage_minutes integer DEFAULT 0,
  last_reset_date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT screen_time_rules_pkey PRIMARY KEY (id),
  CONSTRAINT screen_time_rules_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(id)
);
CREATE TABLE public.search_history (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  child_id uuid,
  query text NOT NULL,
  results_count integer DEFAULT 0,
  clicked_video_id text,
  is_voice_search boolean DEFAULT false,
  is_flagged boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT search_history_pkey PRIMARY KEY (id),
  CONSTRAINT search_history_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(id)
);
CREATE TABLE public.session_sync (
  child_id uuid NOT NULL,
  video_id character varying,
  position integer DEFAULT 0,
  device_id character varying,
  started_at timestamp with time zone DEFAULT now(),
  watch_queue ARRAY DEFAULT '{}'::text[],
  last_synced_at timestamp with time zone DEFAULT now(),
  CONSTRAINT session_sync_pkey PRIMARY KEY (child_id),
  CONSTRAINT session_sync_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(id)
);
CREATE TABLE public.watch_history (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  child_id uuid NOT NULL,
  video_id text NOT NULL,
  video_title text NOT NULL,
  channel_id text NOT NULL,
  channel_name text NOT NULL,
  thumbnail text,
  duration integer,
  watched_duration integer,
  watch_percentage integer,
  completed_watch boolean DEFAULT false,
  category text,
  was_blocked boolean DEFAULT false,
  block_reason text,
  watched_at timestamp with time zone DEFAULT now(),
  CONSTRAINT watch_history_pkey PRIMARY KEY (id),
  CONSTRAINT watch_history_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(id)
);
CREATE TABLE public.weekly_reports (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  parent_id uuid,
  week_start_date date NOT NULL,
  week_end_date date NOT NULL,
  summary jsonb DEFAULT '{}'::jsonb,
  children_reports jsonb DEFAULT '[]'::jsonb,
  generated_at timestamp with time zone DEFAULT now(),
  is_viewed boolean DEFAULT false,
  CONSTRAINT weekly_reports_pkey PRIMARY KEY (id),
  CONSTRAINT weekly_reports_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.parents(id)
);
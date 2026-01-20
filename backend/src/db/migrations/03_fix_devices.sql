-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    device_name VARCHAR(255) NOT NULL,
    device_type VARCHAR(50) DEFAULT 'unknown',
    platform VARCHAR(50),
    push_token TEXT,
    is_active BOOLEAN DEFAULT true,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(child_id, device_id)
);

CREATE TABLE IF NOT EXISTS public.session_sync (
    child_id UUID PRIMARY KEY REFERENCES public.children(id) ON DELETE CASCADE,
    video_id VARCHAR(255),
    position INTEGER DEFAULT 0,
    device_id VARCHAR(255),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    watch_queue TEXT[] DEFAULT '{}',
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for Devices
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY devices_select_policy ON public.devices
  FOR SELECT TO authenticated
  USING (
    child_id IN (SELECT id FROM public.children WHERE parent_id = auth.uid()) 
    OR 
    child_id IN (SELECT child_id FROM public.child_sessions WHERE token_hash IS NOT NULL)
  );

CREATE POLICY devices_insert_policy ON public.devices
  FOR INSERT TO authenticated
  WITH CHECK (true); -- Allow insertion if authenticated (validation logic in service)

CREATE POLICY devices_update_policy ON public.devices
  FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

-- RLS for Session Sync
ALTER TABLE public.session_sync ENABLE ROW LEVEL SECURITY;
CREATE POLICY sync_all_policy ON public.session_sync FOR ALL TO authenticated USING (true) WITH CHECK (true);

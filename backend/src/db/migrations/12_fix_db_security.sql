-- 12. Security Improvements (Fixing Supabase Lints)

-- ==========================================
-- 1. Enable RLS on Public Tables
-- ==========================================

-- child_badges
ALTER TABLE public.child_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS child_badges_select_parent ON public.child_badges;
DROP POLICY IF EXISTS child_badges_insert_system ON public.child_badges;
DROP POLICY IF EXISTS child_badges_parent_access ON public.child_badges;

CREATE POLICY child_badges_parent_access ON public.child_badges
    FOR ALL
    TO authenticated
    USING (
        child_id IN (SELECT id FROM public.children WHERE parent_id = auth.uid()) OR
        child_id IN (SELECT child_id FROM public.child_sessions WHERE token_hash = current_setting('request.jwt.claims', true)::json->>'sub')
    )
    WITH CHECK (
        child_id IN (SELECT id FROM public.children WHERE parent_id = auth.uid())
    );

-- daily_quests
ALTER TABLE public.daily_quests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS daily_quests_parent_access ON public.daily_quests;

CREATE POLICY daily_quests_parent_access ON public.daily_quests
    FOR ALL
    TO authenticated
    USING (
        child_id IN (SELECT id FROM public.children WHERE parent_id = auth.uid())
    );

-- child_inventory (assuming it exists based on lint, if not, create safe ignore)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'child_inventory') THEN
        ALTER TABLE public.child_inventory ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS child_inventory_policy ON public.child_inventory;
        
        EXECUTE 'CREATE POLICY child_inventory_policy ON public.child_inventory FOR ALL TO authenticated USING (child_id IN (SELECT id FROM public.children WHERE parent_id = auth.uid()))';
    END IF;
END $$;

-- child_notifications (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'child_notifications') THEN
        ALTER TABLE public.child_notifications ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS child_notifications_policy ON public.child_notifications;
        
        EXECUTE 'CREATE POLICY child_notifications_policy ON public.child_notifications FOR ALL TO authenticated USING (child_id IN (SELECT id FROM public.children WHERE parent_id = auth.uid()))';
    END IF;
END $$;


-- ==========================================
-- 2. Tighten Permissive Policies
-- ==========================================

-- Devices: Restrict to Parent's Children
DROP POLICY IF EXISTS devices_insert_policy ON public.devices;
DROP POLICY IF EXISTS devices_update_policy ON public.devices;
DROP POLICY IF EXISTS devices_select_policy ON public.devices;
DROP POLICY IF EXISTS devices_all_policy ON public.devices;
-- Note: existing devices_all_policy might be the one lint complained about if user created it manually.

-- Re-create safe policies for Devices
-- Select: Parent owns child OR Child owns device
DROP POLICY IF EXISTS devices_select_secure ON public.devices;

CREATE POLICY devices_select_secure ON public.devices
    FOR SELECT TO authenticated
    USING (
        child_id IN (SELECT id FROM public.children WHERE parent_id = auth.uid())
        -- OR device is current session's device (harder to prove in pure SQL without session link, but typically parent manages devices)
    );

-- Insert/Update/Delete: Parent ONLY
DROP POLICY IF EXISTS devices_modification_secure ON public.devices;

CREATE POLICY devices_modification_secure ON public.devices
    FOR ALL TO authenticated
    USING (
        child_id IN (SELECT id FROM public.children WHERE parent_id = auth.uid())
    )
    WITH CHECK (
        child_id IN (SELECT id FROM public.children WHERE parent_id = auth.uid())
    );


-- Session Sync: Restrict to Parent's Children
DROP POLICY IF EXISTS sync_all_policy ON public.session_sync;
DROP POLICY IF EXISTS sync_secure_policy ON public.session_sync;

CREATE POLICY sync_secure_policy ON public.session_sync
    FOR ALL TO authenticated
    USING (
        child_id IN (SELECT id FROM public.children WHERE parent_id = auth.uid())
    )
    WITH CHECK (
        child_id IN (SELECT id FROM public.children WHERE parent_id = auth.uid())
    );

-- Weekly Reports
DROP POLICY IF EXISTS "System can insert reports" ON public.weekly_reports;
DROP POLICY IF EXISTS weekly_reports_insert_secure ON public.weekly_reports;

CREATE POLICY weekly_reports_insert_secure ON public.weekly_reports
    FOR INSERT TO authenticated
    WITH CHECK (
        parent_id = auth.uid()
    );


-- ==========================================
-- 3. Secure Functions (Search Path)
-- ==========================================

ALTER FUNCTION public.enforce_child_limit_on_insert() SET search_path = public;
ALTER FUNCTION public.check_child_limit(UUID) SET search_path = public;
ALTER FUNCTION public.set_age_appropriate_level() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

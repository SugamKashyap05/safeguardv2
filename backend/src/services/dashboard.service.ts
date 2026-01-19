import { supabaseAdmin } from '../config/supabase';

export class DashboardService {
    async getStats(parentId: string) {
        // 1. Total Children
        const { count: totalChildren } = await supabaseAdmin
            .from('children')
            .select('*', { count: 'exact', head: true })
            .eq('parent_id', parentId);

        // 2. Active Children
        const { count: activeChildren } = await supabaseAdmin
            .from('children')
            .select('*', { count: 'exact', head: true })
            .eq('parent_id', parentId)
            .eq('is_active', true);

        // 3. Child IDs for detailed stats
        const { data: children } = await supabaseAdmin
            .from('children')
            .select('id, name, avatar')
            .eq('parent_id', parentId);

        const childIds = children?.map(c => c.id) || [];

        // 4. Watch Time Today (Sum from screen_time_rules)
        // Wait, screen_time_rules has `today_usage_minutes`.
        let totalWatchTime = 0;
        if (childIds.length > 0) {
            const { data: rules } = await supabaseAdmin
                .from('screen_time_rules')
                .select('today_usage_minutes')
                .in('child_id', childIds);

            totalWatchTime = rules?.reduce((sum, r) => sum + (r.today_usage_minutes || 0), 0) || 0;
        }

        // 5. Videos Watched Today (Count from history)
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of day

        const { count: videosWatched } = await supabaseAdmin
            .from('watch_history')
            .select('*', { count: 'exact', head: true })
            .in('child_id', childIds)
            .gte('watched_at', today.toISOString());

        // 6. Top Categories (Aggregation - Simulated via SQL or JS)
        // Since Supabase JS has limited aggregation, we'll fetch recent history and aggregate in JS or use RPC if exists.
        // For simplicity/performance: fetch recent 100 watched today
        // Real app: use RPC function 'get_top_categories(parent_id)'
        const { data: recentHistory } = await supabaseAdmin
            .from('watch_history')
            .select('category')
            .in('child_id', childIds)
            .gte('watched_at', today.toISOString())
            .limit(100);

        const categoryMap: Record<string, number> = {};
        recentHistory?.forEach(h => {
            if (h.category) categoryMap[h.category] = (categoryMap[h.category] || 0) + 1;
        });

        const topCategories = Object.entries(categoryMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        return {
            totalChildren,
            activeChildren,
            totalWatchTime,
            videosWatched,
            topCategories
        };
    }

    async getActivity(parentId: string) {
        const { data: children } = await supabaseAdmin
            .from('children')
            .select('id')
            .eq('parent_id', parentId);

        const childIds = children?.map(c => c.id) || [];

        if (childIds.length === 0) return { recentActivity: [], flaggedContent: [], alerts: [] };

        // 1. Recent Activity Log (General)
        const { data: recentActivity } = await supabaseAdmin
            .from('activity_logs')
            .select('*, children(name, avatar)')
            .in('child_id', childIds)
            .order('timestamp', { ascending: false })
            .limit(20);

        // 2. Flagged Content (Blocked Content Table)
        const { data: flaggedContent } = await supabaseAdmin
            .from('blocked_content')
            .select('*, children(name)')
            .in('child_id', childIds)
            .order('blocked_at', { ascending: false })
            .limit(10);

        // 3. Alerts (Notifications)
        const { data: alerts } = await supabaseAdmin
            .from('notifications')
            .select('*')
            .eq('parent_id', parentId)
            .eq('is_read', false)
            .limit(5);

        return {
            recentActivity,
            flaggedContent,
            alerts
        };
    }
}

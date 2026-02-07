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
            .select('id, name')
            .eq('parent_id', parentId);

        const childIds = children?.map(c => c.id) || [];
        const childMap = children?.reduce((acc: any, c) => ({ ...acc, [c.id]: c.name }), {}) || {};

        if (childIds.length === 0) return { recentActivity: [], flaggedContent: [], alerts: [], weeklyHistory: [], recentBadges: [], liveStatus: {} };

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

        // 4. Weekly History (Last 7 Days)
        const weeklyHistory: any[] = [];
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const startDay = new Date(dateStr).toISOString();
            const endDay = new Date(date).setHours(23, 59, 59, 999);
            const endDayStr = new Date(endDay).toISOString();

            // Aggregate watch_history for this day
            // Note: This loop is N+1 but strictly bounded to 7 iterations. 
            // In prod, use SQL function `date_trunc`.

            const { data: dayLogs } = await supabaseAdmin
                .from('watch_history')
                .select('watched_duration')
                .in('child_id', childIds)
                .gte('watched_at', startDay)
                .lte('watched_at', endDayStr);

            // Sum seconds -> minutes
            const totalSeconds = dayLogs?.reduce((sum, log) => sum + (log.watched_duration || 0), 0) || 0;
            weeklyHistory.push({
                name: date.toLocaleDateString('en-US', { weekday: 'short' }), // Mon, Tue
                minutes: Math.round(totalSeconds / 60)
            });
        }

        // 5. Recent Badges
        const { data: recentBadges } = await supabaseAdmin
            .from('child_badges')
            .select('badge_id, earned_at, children(name), metadata')
            .in('child_id', childIds)
            .order('earned_at', { ascending: false })
            .limit(5);

        const mappedBadges = recentBadges?.map(b => ({
            name: b.badge_id, // Or map ID to Name if static
            icon: b.metadata?.icon || 'https://cdn-icons-png.flaticon.com/512/616/616490.png',
            childName: (b.children as any)?.name,
            earnedAt: b.earned_at
        })) || [];

        // 6. Live Status (Real)
        const { data: sessions } = await supabaseAdmin
            .from('session_sync')
            .select('*')
            .in('child_id', childIds)
            // Filter stale sessions? e.g. updated in last 10 mins
            .gt('last_synced_at', new Date(Date.now() - 10 * 60 * 1000).toISOString());

        const activeSessionMap = new Map();
        if (sessions) {
            for (const s of sessions) {
                activeSessionMap.set(s.child_id, s);
            }
        }

        // Fetch Metadata for active videos
        const videoIds = sessions?.map(s => s.video_id) || [];
        // We can fetch from watch_history (distinct video_id) to get metadata
        let videoMetaMap: Record<string, any> = {};

        if (videoIds.length > 0) {
            // This query might be slow if history is huge, but we limit to specific video IDs
            // A better approach is a dedicated 'videos' table, but for now history works.
            const { data: metas } = await supabaseAdmin
                .from('watch_history')
                .select('video_id, video_title, thumbnail, channel_name')
                .in('video_id', videoIds)
                .order('watched_at', { ascending: false }); // Get most recents

            // Dedupe
            metas?.forEach(m => {
                if (!videoMetaMap[m.video_id]) {
                    videoMetaMap[m.video_id] = m;
                }
            });
        }

        const childrenStatus = children?.map(c => {
            const session = activeSessionMap.get(c.id);
            const isOnline = !!session; // Simple online check based on recent sync

            let currentVideo = null;
            if (isOnline && session.video_id) {
                const meta = videoMetaMap[session.video_id];
                currentVideo = {
                    title: meta?.video_title || 'Unknown Video',
                    thumbnail: meta?.thumbnail || 'https://via.placeholder.com/150',
                    channel: meta?.channel_name || 'YouTube'
                };
            }

            return {
                childId: c.id,
                childName: c.name,
                status: isOnline ? 'online' : 'offline',
                currentVideo
            };
        }) || [];


        return {
            recentActivity,
            flaggedContent,
            alerts,
            weeklyHistory,
            recentBadges: mappedBadges,
            children: childrenStatus // Overwrite/augment children list with status
        };
    }
}

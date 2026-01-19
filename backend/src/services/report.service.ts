import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';
import { HTTP_STATUS } from '../utils/httpStatus';

interface ChildReport {
    childId: string;
    childName: string;
    totalMinutes: number;
    videosWatched: number;
    blockedAttempts: number;
    topCategories: { category: string; count: number }[];
    insights: { type: 'positive' | 'neutral' | 'alert'; message: string; icon: string }[];
}

export class ReportService {

    /**
     * Generate or Retrieve Weekly Report
     */
    async getWeeklyReport(parentId: string, weekStartDate: string) {
        // 1. Check if exists
        const { data: existing } = await supabaseAdmin
            .from('weekly_reports')
            .select('*')
            .eq('parent_id', parentId)
            .eq('week_start_date', weekStartDate)
            .single();

        if (existing) return existing;

        // 2. Generate if not exists (and if week has passed? Or dynamic? 
        // For MVP, allow on-demand generation for "current week" or "past week")
        return this.generateWeeklyReport(parentId, weekStartDate);
    }

    async generateWeeklyReport(parentId: string, weekStartStr: string) {
        const weekStart = new Date(weekStartStr);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        // 1. Get Children
        const { data: children } = await supabaseAdmin
            .from('children')
            .select('*')
            .eq('parent_id', parentId)
            .eq('is_active', true);

        if (!children || children.length === 0) {
            throw new AppError('No active children found', HTTP_STATUS.NOT_FOUND);
        }

        const report = {
            parent_id: parentId,
            week_start_date: weekStartStr,
            week_end_date: weekEnd.toISOString().split('T')[0],
            summary: {
                totalWatchTimeMinutes: 0,
                totalVideosWatched: 0,
                totalBlockedAttempts: 0,
                averageDailyTime: 0
            },
            children_reports: [] as ChildReport[]
        };

        // 2. Process each child
        for (const child of children) {
            const childStats = await this.generateChildStats(child, weekStart, weekEnd);
            report.children_reports.push(childStats);

            report.summary.totalWatchTimeMinutes += childStats.totalMinutes;
            report.summary.totalVideosWatched += childStats.videosWatched;
            report.summary.totalBlockedAttempts += childStats.blockedAttempts;
        }

        report.summary.averageDailyTime = Math.round(report.summary.totalWatchTimeMinutes / 7);

        // 3. Save Report
        const { data, error } = await supabaseAdmin
            .from('weekly_reports')
            .insert(report)
            .select()
            .single();

        if (error) {
            console.error('Failed to save report', error);
            // If duplicate (race condition), just return what was there
            // or re-fetch. For now, throw.
            throw new AppError('Failed to save report', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }

        return data;
    }

    private async generateChildStats(child: any, start: Date, end: Date): Promise<ChildReport> {
        // Watch History
        const { data: history } = await supabaseAdmin
            .from('watch_history')
            .select('*')
            .eq('child_id', child.id)
            .gte('watched_at', start.toISOString())
            .lt('watched_at', end.toISOString());

        // Blocked Content / Activity Logs
        // Assuming we log blocked attempts in activity_logs or blocked_content
        const { count: blockedCount } = await supabaseAdmin
            .from('activity_logs')
            .select('*', { count: 'exact', head: true })
            .eq('child_id', child.id)
            .eq('type', 'blocked_attempt')
            .gte('timestamp', start.toISOString())
            .lt('timestamp', end.toISOString());

        const videos = history || [];
        // Calculate totals
        // Assuming 'watched_duration' is in seconds, user prompt said minutes? 
        // Let's assume watched_duration is SECONDS in DB based on previous schema work, so / 60.
        // Or if schema says INTEGER, let's assume seconds.
        const totalSeconds = videos.reduce((acc, v) => acc + (v.watched_duration || 0), 0);
        const totalMinutes = Math.round(totalSeconds / 60);

        // Top Categories
        const catMap: Record<string, number> = {};
        videos.forEach(v => {
            const cat = v.category || 'Uncategorized';
            catMap[cat] = (catMap[cat] || 0) + 1;
        });
        const topCategories = Object.entries(catMap)
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Insights
        const insights = this.generateInsights(videos, blockedCount || 0);

        return {
            childId: child.id,
            childName: child.name,
            totalMinutes,
            videosWatched: videos.length,
            blockedAttempts: blockedCount || 0,
            topCategories,
            insights
        };
    }

    private generateInsights(history: any[], blockedCount: number) {
        const insights: { type: 'positive' | 'neutral' | 'alert'; message: string; icon: string }[] = [];

        // Education
        const eduCount = history.filter(v =>
            (v.category && v.category.toLowerCase().includes('education')) ||
            (v.category && v.category.toLowerCase().includes('science'))
        ).length;

        if (history.length > 0) {
            const eduPercent = (eduCount / history.length) * 100;
            if (eduPercent > 40) {
                insights.push({
                    type: 'positive',
                    icon: '🎓',
                    message: 'Great learning focus! A signficant portion of watch time was educational.'
                });
            }
        }

        // Completion
        const completedCount = history.filter(v => v.completed_watch).length;
        if (history.length > 10) {
            const completeRate = (completedCount / history.length) * 100;
            if (completeRate < 30) {
                insights.push({
                    type: 'neutral',
                    icon: '⏭️',
                    message: 'Frequent skipping. Consider shorter videos or checking if content is engaging.'
                });
            }
        }

        // Blocked
        if (blockedCount > 5) {
            insights.push({
                type: 'alert',
                icon: '⚠️',
                message: `${blockedCount} attempts to access blocked content. You may want to review filters.`
            });
        }

        return insights;
    }
}

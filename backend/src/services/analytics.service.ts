import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';
import { HTTP_STATUS } from '../utils/httpStatus';

interface DateRange {
    start: Date;
    end: Date;
}

interface ChildAnalytics {
    overview: {
        totalWatchTime: number;
        videosWatched: number;
        avgSessionLength: number;
        completionRate: number;
        educationalPercent: number;
    };
    trends: {
        dailyUsage: { date: string; minutes: number; limit: number }[];
        peakHours: { hour: number; minutes: number }[];
        dayOfWeekPattern: { day: string; minutes: number }[];
    };
    content: {
        topCategories: { name: string; value: number; color: string }[];
        topChannels: { id: string; name: string; thumbnail: string; watchTime: number }[];
        topVideos: { id: string; title: string; thumbnail: string; views: number }[];
    };
    safety: {
        blockedAttempts: number;
        approvalRequests: number;
        limitHits: number;
    };
    insights: Insight[];
}

interface Insight {
    type: 'positive' | 'attention' | 'info';
    icon: string;
    title: string;
    message: string;
    score?: number;
    actionText?: string;
    actionUrl?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
    'Education': '#4F46E5',
    'Entertainment': '#EC4899',
    'Gaming': '#10B981',
    'Music': '#F59E0B',
    'Science': '#06B6D4',
    'Sports': '#EF4444',
    'Art': '#8B5CF6',
    'Other': '#6B7280'
};

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export class AnalyticsService {

    /**
     * Get comprehensive analytics for a child
     */
    async getChildAnalytics(childId: string, range: number = 30): Promise<ChildAnalytics> {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - range);

        // Fetch watch history
        const { data: watchHistory, error } = await supabaseAdmin
            .from('watch_history')
            .select('*')
            .eq('child_id', childId)
            .gte('watched_at', startDate.toISOString())
            .lte('watched_at', endDate.toISOString())
            .order('watched_at', { ascending: false });

        if (error) throw new AppError('Failed to fetch watch history', HTTP_STATUS.INTERNAL_SERVER_ERROR);

        const history = watchHistory || [];

        // Get screen time rules for limit comparison
        const { data: screenTimeRule } = await supabaseAdmin
            .from('screen_time_rules')
            .select('daily_limit_minutes')
            .eq('child_id', childId)
            .single();

        const dailyLimit = screenTimeRule?.daily_limit_minutes || 60;

        // Calculate overview
        const overview = this.calculateOverview(history);

        // Calculate trends
        const trends = this.calculateTrends(history, startDate, endDate, dailyLimit);

        // Calculate content breakdown
        const content = this.calculateContent(history);

        // Get safety stats
        const safety = await this.getSafetyStats(childId, startDate, endDate);

        // Generate insights
        const insights = this.generateInsights(overview, safety, trends);

        return { overview, trends, content, safety, insights };
    }

    private calculateOverview(history: any[]) {
        const totalWatchTime = history.reduce((sum, h) => sum + (h.watched_duration || 0), 0) / 60; // to minutes
        const videosWatched = history.length;

        // Average session - group by date and calculate
        const sessionsByDate: Record<string, number> = {};
        history.forEach(h => {
            const date = new Date(h.watched_at).toDateString();
            sessionsByDate[date] = (sessionsByDate[date] || 0) + (h.watched_duration || 0) / 60;
        });
        const sessionDays = Object.keys(sessionsByDate).length || 1;
        const avgSessionLength = totalWatchTime / sessionDays;

        // Completion rate
        const completedVideos = history.filter(h => h.watch_percentage >= 80).length;
        const completionRate = videosWatched > 0 ? Math.round((completedVideos / videosWatched) * 100) : 0;

        // Educational percentage (mark as educational if category contains education-related keywords)
        const educationalKeywords = ['education', 'learning', 'science', 'math', 'tutorial', 'documentary'];
        const educationalVideos = history.filter(h => {
            const category = (h.category || '').toLowerCase();
            const title = (h.video_title || '').toLowerCase();
            return educationalKeywords.some(kw => category.includes(kw) || title.includes(kw));
        }).length;
        const educationalPercent = videosWatched > 0 ? Math.round((educationalVideos / videosWatched) * 100) : 0;

        return {
            totalWatchTime: Math.round(totalWatchTime),
            videosWatched,
            avgSessionLength: Math.round(avgSessionLength),
            completionRate,
            educationalPercent
        };
    }

    private calculateTrends(history: any[], startDate: Date, endDate: Date, dailyLimit: number) {
        // Daily usage
        const dailyUsage: { date: string; minutes: number; limit: number }[] = [];
        const current = new Date(startDate);

        while (current <= endDate) {
            const dateStr = current.toISOString().split('T')[0];
            const dayHistory = history.filter(h =>
                new Date(h.watched_at).toISOString().split('T')[0] === dateStr
            );
            const minutes = dayHistory.reduce((sum, h) => sum + (h.watched_duration || 0), 0) / 60;

            dailyUsage.push({
                date: dateStr,
                minutes: Math.round(minutes),
                limit: dailyLimit
            });

            current.setDate(current.getDate() + 1);
        }

        // Peak hours
        const hourlyMinutes: number[] = Array(24).fill(0);
        history.forEach(h => {
            const hour = new Date(h.watched_at).getHours();
            hourlyMinutes[hour] += (h.watched_duration || 0) / 60;
        });

        const peakHours = hourlyMinutes.map((minutes, hour) => ({
            hour,
            minutes: Math.round(minutes)
        })).filter(h => h.minutes > 0);

        // Day of week pattern
        const dayMinutes: number[] = Array(7).fill(0);
        history.forEach(h => {
            const day = new Date(h.watched_at).getDay();
            dayMinutes[day] += (h.watched_duration || 0) / 60;
        });

        const dayOfWeekPattern = DAYS_OF_WEEK.map((day, idx) => ({
            day,
            minutes: Math.round(dayMinutes[idx])
        }));

        return { dailyUsage, peakHours, dayOfWeekPattern };
    }

    private calculateContent(history: any[]) {
        // Top categories
        const categoryCount: Record<string, number> = {};
        history.forEach(h => {
            const category = h.category || 'Other';
            categoryCount[category] = (categoryCount[category] || 0) + (h.watched_duration || 0) / 60;
        });

        const topCategories = Object.entries(categoryCount)
            .map(([name, value]) => ({
                name,
                value: Math.round(value),
                color: CATEGORY_COLORS[name] || CATEGORY_COLORS['Other']
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);

        // Top channels
        const channelWatchTime: Record<string, { name: string; thumbnail: string; watchTime: number }> = {};
        history.forEach(h => {
            const id = h.channel_id || 'unknown';
            if (!channelWatchTime[id]) {
                channelWatchTime[id] = {
                    name: h.channel_name || 'Unknown',
                    thumbnail: h.channel_thumbnail || '',
                    watchTime: 0
                };
            }
            channelWatchTime[id].watchTime += (h.watched_duration || 0) / 60;
        });

        const topChannels = Object.entries(channelWatchTime)
            .map(([id, data]) => ({ id, ...data, watchTime: Math.round(data.watchTime) }))
            .sort((a, b) => b.watchTime - a.watchTime)
            .slice(0, 5);

        // Top videos (by view count)
        const videoViews: Record<string, { title: string; thumbnail: string; views: number }> = {};
        history.forEach(h => {
            const id = h.video_id || 'unknown';
            if (!videoViews[id]) {
                videoViews[id] = {
                    title: h.video_title || 'Unknown',
                    thumbnail: h.thumbnail || '',
                    views: 0
                };
            }
            videoViews[id].views++;
        });

        const topVideos = Object.entries(videoViews)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 5);

        return { topCategories, topChannels, topVideos };
    }

    private async getSafetyStats(childId: string, startDate: Date, endDate: Date) {
        // Blocked attempts
        const { count: blockedCount } = await supabaseAdmin
            .from('watch_history')
            .select('*', { count: 'exact', head: true })
            .eq('child_id', childId)
            .eq('was_blocked', true)
            .gte('watched_at', startDate.toISOString())
            .lte('watched_at', endDate.toISOString());

        // Approval requests
        const { count: approvalCount } = await supabaseAdmin
            .from('approval_requests')
            .select('*', { count: 'exact', head: true })
            .eq('child_id', childId)
            .gte('requested_at', startDate.toISOString())
            .lte('requested_at', endDate.toISOString());

        // Screen time limit hits (days where usage >= limit)
        const { data: rules } = await supabaseAdmin
            .from('screen_time_rules')
            .select('daily_limit_minutes')
            .eq('child_id', childId)
            .single();

        const dailyLimit = rules?.daily_limit_minutes || 60;

        const { data: activityLogs } = await supabaseAdmin
            .from('activity_logs')
            .select('*')
            .eq('child_id', childId)
            .eq('type', 'screen_time_limit_reached')
            .gte('timestamp', startDate.toISOString())
            .lte('timestamp', endDate.toISOString());

        return {
            blockedAttempts: blockedCount || 0,
            approvalRequests: approvalCount || 0,
            limitHits: activityLogs?.length || 0
        };
    }

    private generateInsights(overview: any, safety: any, trends: any): Insight[] {
        const insights: Insight[] = [];

        // Educational content insight
        if (overview.educationalPercent >= 70) {
            insights.push({
                type: 'positive',
                icon: '📚',
                title: 'Excellent Learning Focus!',
                message: `${overview.educationalPercent}% of watched content is educational`,
                score: 95
            });
        } else if (overview.educationalPercent < 30) {
            insights.push({
                type: 'info',
                icon: '💡',
                title: 'Boost Educational Content',
                message: 'Consider adding more educational channels to the approved list',
                actionText: 'Discover Channels',
                actionUrl: '/parent/channels'
            });
        }

        // Completion rate
        if (overview.completionRate >= 80) {
            insights.push({
                type: 'positive',
                icon: '✅',
                title: 'Great Attention Span!',
                message: 'Videos are being watched to completion',
                score: 90
            });
        }

        // Safety concerns
        if (safety.blockedAttempts > 5) {
            insights.push({
                type: 'attention',
                icon: '⚠️',
                title: 'Review Content Filters',
                message: `${safety.blockedAttempts} blocked access attempts this period`,
                actionText: 'Review Filters',
                actionUrl: '/settings/filters'
            });
        }

        // Screen time patterns
        const avgDailyMinutes = trends.dailyUsage.reduce((s: number, d: any) => s + d.minutes, 0) / (trends.dailyUsage.length || 1);
        const limit = trends.dailyUsage[0]?.limit || 60;

        if (avgDailyMinutes > limit * 0.9) {
            insights.push({
                type: 'attention',
                icon: '⏰',
                title: 'Approaching Daily Limits',
                message: 'Average usage is close to the daily limit',
                actionText: 'Adjust Limits',
                actionUrl: '/settings/screentime'
            });
        }

        // Weekend vs weekday
        const weekdayMinutes = trends.dayOfWeekPattern
            .filter((_: any, i: number) => i > 0 && i < 6)
            .reduce((s: number, d: any) => s + d.minutes, 0);
        const weekendMinutes = trends.dayOfWeekPattern
            .filter((_: any, i: number) => i === 0 || i === 6)
            .reduce((s: number, d: any) => s + d.minutes, 0);

        if (weekendMinutes > weekdayMinutes * 2) {
            insights.push({
                type: 'info',
                icon: '📅',
                title: 'Weekend Heavy Usage',
                message: 'Significantly more screen time on weekends',
            });
        }

        return insights;
    }

    /**
     * Get family-level analytics for parent dashboard
     */
    async getParentDashboardAnalytics(parentId: string) {
        // Get all children
        const { data: children } = await supabaseAdmin
            .from('children')
            .select('id, name, avatar')
            .eq('parent_id', parentId)
            .eq('is_active', true);

        if (!children || children.length === 0) {
            return { familyOverview: null, childrenAnalytics: [], insights: [] };
        }

        // Get analytics for each child
        const childrenAnalytics = await Promise.all(
            children.map(async (child) => ({
                child,
                analytics: await this.getChildAnalytics(child.id, 30)
            }))
        );

        // Aggregate family overview
        const familyOverview = {
            totalWatchTime: childrenAnalytics.reduce((s, c) => s + c.analytics.overview.totalWatchTime, 0),
            totalVideos: childrenAnalytics.reduce((s, c) => s + c.analytics.overview.videosWatched, 0),
            avgEducational: Math.round(
                childrenAnalytics.reduce((s, c) => s + c.analytics.overview.educationalPercent, 0) / childrenAnalytics.length
            ),
            avgCompletion: Math.round(
                childrenAnalytics.reduce((s, c) => s + c.analytics.overview.completionRate, 0) / childrenAnalytics.length
            )
        };

        return { familyOverview, childrenAnalytics };
    }
}

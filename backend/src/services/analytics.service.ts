import prisma from '../config/prisma';

export class AnalyticsService {

    async getChildSummary(childId: string, parentId: string): Promise<{
        totalWatchTimeMinutes: number;
        uniqueVideos: number;
        uniqueChannels: number;
        blockedAttempts: number;
        averageWatchPercentage: number;
        topChannels: { channelName: string; count: number }[];
        watchTrend: { date: string; minutes: number }[];
    }> {
        // Verify ownership
        const child = await prisma.child.findFirst({ where: { id: childId, parentId } });
        if (!child) throw new Error('Child not found');

        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const [history, blockedCount] = await Promise.all([
            prisma.watchHistory.findMany({
                where: { childId, watchedAt: { gte: thirtyDaysAgo } },
                select: {
                    videoId: true,
                    channelId: true,
                    channelName: true,
                    watchedDuration: true,
                    watchPercentage: true,
                    watchedAt: true,
                    wasBlocked: true,
                },
            }),
            prisma.watchHistory.count({
                where: { childId, watchedAt: { gte: thirtyDaysAgo }, wasBlocked: true },
            }),
        ]);

        const nonBlocked = history.filter(h => !h.wasBlocked);

        const totalWatchTimeMinutes = Math.round(
            nonBlocked.reduce((sum, h) => sum + (h.watchedDuration ?? 0), 0) / 60,
        );

        const uniqueVideos = new Set(nonBlocked.map(h => h.videoId)).size;
        const uniqueChannels = new Set(nonBlocked.map(h => h.channelId)).size;

        const percentages = nonBlocked
            .map(h => h.watchPercentage)
            .filter((p): p is number => p !== null && p !== undefined);
        const averageWatchPercentage = percentages.length > 0
            ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length)
            : 0;

        // Top channels
        const channelMap = new Map<string, { channelName: string; count: number }>();
        for (const h of nonBlocked) {
            if (h.channelId) {
                const entry = channelMap.get(h.channelId);
                if (entry) entry.count++;
                else channelMap.set(h.channelId, { channelName: h.channelName ?? h.channelId, count: 1 });
            }
        }
        const topChannels = [...channelMap.values()]
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Watch trend (daily minutes for last 7 days)
        const watchTrend = this.buildDailyTrend(nonBlocked);

        return { totalWatchTimeMinutes, uniqueVideos, uniqueChannels, blockedAttempts: blockedCount, averageWatchPercentage, topChannels, watchTrend };
    }

    async getDashboardStats(parentId: string): Promise<{
        totalChildren: number;
        totalWatchTimeToday: number;
        blockedAttemptsToday: number;
        pendingApprovals: number;
        childrenSummaries: {
            childId: string;
            name: string;
            todayMinutes: number;
            isActive: boolean;
        }[];
    }> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [children, pendingApprovals] = await Promise.all([
            prisma.child.findMany({
                where: { parentId },
                select: {
                    id: true,
                    name: true,
                    isActive: true,
                    screenTimeRules: { select: { todayUsageMinutes: true } },
                },
            }),
            prisma.approvalRequest.count({
                where: {
                    status: 'pending',
                    child: { parentId },
                },
            }),
        ]);

        const childrenSummaries = children.map(c => ({
            childId: c.id,
            name: c.name,
            todayMinutes: c.screenTimeRules?.todayUsageMinutes ?? 0,
            isActive: c.isActive,
        }));

        const [todayWatchTime, blockedAttemptsToday] = await Promise.all([
            prisma.watchHistory.count({
                where: {
                    childId: { in: children.map(c => c.id) },
                    watchedAt: { gte: today },
                    wasBlocked: false,
                },
            }),
            prisma.watchHistory.count({
                where: {
                    childId: { in: children.map(c => c.id) },
                    watchedAt: { gte: today },
                    wasBlocked: true,
                },
            }),
        ]);

        return {
            totalChildren: children.length,
            totalWatchTimeToday: todayWatchTime,
            blockedAttemptsToday,
            pendingApprovals,
            childrenSummaries,
        };
    }

    async getWatchPatterns(childId: string, days = 7) {
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const history = await prisma.watchHistory.findMany({
            where: { childId, watchedAt: { gte: since }, wasBlocked: false },
            select: { watchedAt: true, watchedDuration: true },
            orderBy: { watchedAt: 'asc' },
        });

        const hourlyBuckets = new Array(24).fill(0);
        for (const h of history) {
            const hour = new Date(h.watchedAt).getHours();
            hourlyBuckets[hour] += Math.round((h.watchedDuration ?? 0) / 60);
        }

        return { hourlyPattern: hourlyBuckets.map((minutes, hour) => ({ hour, minutes })) };
    }

    private buildDailyTrend(history: { watchedAt: Date; watchedDuration: number | null }[]) {
        const days: Record<string, number> = {};
        const labels: string[] = [];

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            days[key] = 0;
            labels.push(key);
        }

        for (const h of history) {
            const key = new Date(h.watchedAt).toISOString().split('T')[0];
            if (key in days) {
                days[key] += Math.round((h.watchedDuration ?? 0) / 60);
            }
        }

        return labels.map(date => ({ date, minutes: days[date] }));
    }
}

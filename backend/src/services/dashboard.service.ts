import prisma from '../config/prisma';

export class DashboardService {

    async getStats(parentId: string) {
        const children = await prisma.child.findMany({
            where: { parentId },
            select: { id: true, isActive: true, screenTimeRules: { select: { todayUsageMinutes: true } } },
        });

        const childIds = children.map(c => c.id);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [videosWatched, categoryHistory] = await Promise.all([
            prisma.watchHistory.count({
                where: { childId: { in: childIds }, watchedAt: { gte: today } },
            }),
            prisma.watchHistory.findMany({
                where: { childId: { in: childIds }, watchedAt: { gte: today } },
                select: { category: true },
                take: 100,
            }),
        ]);

        const totalWatchTime = children.reduce(
            (sum, c) => sum + (c.screenTimeRules?.todayUsageMinutes ?? 0),
            0,
        );

        const categoryMap: Record<string, number> = {};
        for (const h of categoryHistory) {
            if (h.category) categoryMap[h.category] = (categoryMap[h.category] ?? 0) + 1;
        }
        const topCategories = Object.entries(categoryMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        return {
            totalChildren: children.length,
            activeChildren: children.filter(c => c.isActive).length,
            totalWatchTime,
            videosWatched,
            topCategories,
        };
    }

    async getActivity(parentId: string) {
        const children = await prisma.child.findMany({
            where: { parentId },
            select: { id: true, name: true },
        });

        if (children.length === 0) {
            return { recentActivity: [], flaggedContent: [], alerts: [], weeklyHistory: [], recentBadges: [], children: [] };
        }

        const childIds = children.map(c => c.id);
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

        const [recentActivity, flaggedContent, alerts, recentBadges, activeSessions] = await Promise.all([
            prisma.activityLog.findMany({
                where: { childId: { in: childIds } },
                orderBy: { timestamp: 'desc' },
                take: 20,
                include: { child: { select: { name: true, avatar: true } } },
            }),
            prisma.blockedContent.findMany({
                where: { childId: { in: childIds } },
                orderBy: { blockedAt: 'desc' },
                take: 10,
                include: { child: { select: { name: true } } },
            }),
            prisma.notification.findMany({
                where: { parentId, isRead: false },
                orderBy: { createdAt: 'desc' },
                take: 5,
            }),
            prisma.childBadge.findMany({
                where: { childId: { in: childIds } },
                orderBy: { earnedAt: 'desc' },
                take: 5,
                include: { child: { select: { name: true } } },
            }),
            prisma.sessionSync.findMany({
                where: {
                    childId: { in: childIds },
                    lastSyncedAt: { gte: tenMinutesAgo },
                },
            }),
        ]);

        // Build weekly history (last 7 days)
        const weeklyHistory: { name: string; minutes: number }[] = [];
        const now = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);

            const dayLogs = await prisma.watchHistory.findMany({
                where: {
                    childId: { in: childIds },
                    watchedAt: { gte: date, lt: nextDay },
                },
                select: { watchedDuration: true },
            });

            const totalSeconds = dayLogs.reduce((sum, log) => sum + (log.watchedDuration ?? 0), 0);
            weeklyHistory.push({
                name: date.toLocaleDateString('en-US', { weekday: 'short' }),
                minutes: Math.round(totalSeconds / 60),
            });
        }

        // Live status via session_sync
        const sessionMap = new Map(activeSessions.map(s => [s.childId, s]));

        // Get video metadata for active sessions
        const activeVideoIds = activeSessions.map(s => s.videoId).filter(Boolean) as string[];
        const videoMetas = activeVideoIds.length > 0
            ? await prisma.watchHistory.findMany({
                where: { videoId: { in: activeVideoIds } },
                select: { videoId: true, videoTitle: true, thumbnail: true, channelName: true },
                orderBy: { watchedAt: 'desc' },
                distinct: ['videoId'],
            })
            : [];
        const videoMetaMap = new Map(videoMetas.map(m => [m.videoId, m]));

        const childrenStatus = children.map(c => {
            const session = sessionMap.get(c.id);
            const isOnline = !!session;
            let currentVideo = null;
            if (isOnline && session?.videoId) {
                const meta = videoMetaMap.get(session.videoId);
                currentVideo = {
                    title: meta?.videoTitle ?? 'Unknown Video',
                    thumbnail: meta?.thumbnail ?? '',
                    channel: meta?.channelName ?? 'YouTube',
                };
            }
            return { childId: c.id, childName: c.name, status: isOnline ? 'online' : 'offline', currentVideo };
        });

        const mappedBadges = recentBadges.map(b => ({
            name: b.badgeId,
            icon: (b.metadata as any)?.icon as string ?? '🏅',
            childName: b.child.name,
            earnedAt: b.earnedAt,
        }));

        return { recentActivity, flaggedContent, alerts, weeklyHistory, recentBadges: mappedBadges, children: childrenStatus };
    }
}

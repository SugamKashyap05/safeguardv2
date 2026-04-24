import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { HTTP_STATUS } from '../utils/httpStatus';
import { getStartOfLocalDay } from '../utils/dateUtils';

export class ActivityTrackingService {

    async recordWatchHistory(data: {
        childId: string;
        videoId: string;
        videoTitle: string;
        channelId: string;
        channelName: string;
        channelThumbnail?: string;
        thumbnail?: string;
        duration?: number;
        watchedDuration?: number;
        watchPercentage?: number;
        completedWatch?: boolean;
        category?: string;
        wasBlocked?: boolean;
        blockReason?: string;
    }) {
        // Check if child is paused before allowing watch activity
        const child = await prisma.child.findUnique({
            where: { id: data.childId },
            select: { isActive: true, pauseReason: true }
        });

        if (!child || !child.isActive) {
            throw new AppError(
                child?.pauseReason || 'Access paused by parent',
                HTTP_STATUS.FORBIDDEN
            );
        }

        return prisma.watchHistory.create({ data });
    }

    async updateWatchProgress(childId: string, videoId: string, updates: {
        watchedDuration?: number;
        watchPercentage?: number;
        completedWatch?: boolean;
    }) {
        // Update the most recent record for this video
        const record = await prisma.watchHistory.findFirst({
            where: { childId, videoId },
            orderBy: { watchedAt: 'desc' },
        });
        if (!record) return null;

        return prisma.watchHistory.update({
            where: { id: record.id },
            data: updates,
        });
    }
    async updateProgress(id: string, watchedDuration: number, duration: number) {
        // First get the watch record to check child status
        const record = await prisma.watchHistory.findUnique({
            where: { id },
            select: { childId: true }
        });

        if (!record) {
            throw new AppError('Watch record not found', HTTP_STATUS.NOT_FOUND);
        }

        // Check if child is paused before allowing watch activity updates
        const child = await prisma.child.findUnique({
            where: { id: record.childId },
            select: { isActive: true, pauseReason: true }
        });

        if (!child || !child.isActive) {
            throw new AppError(
                child?.pauseReason || 'Access paused by parent',
                HTTP_STATUS.FORBIDDEN
            );
        }

        return prisma.watchHistory.update({
            where: { id },
            data: {
                watchedDuration,
                duration,
                watchPercentage: duration > 0 ? (watchedDuration / duration) * 100 : 0
            },
        });
    }

    async markComplete(id: string) {
        // First get the watch record to check child status
        const record = await prisma.watchHistory.findUnique({
            where: { id },
            select: { childId: true }
        });

        if (!record) {
            throw new AppError('Watch record not found', HTTP_STATUS.NOT_FOUND);
        }

        // Check if child is paused before allowing completion
        const child = await prisma.child.findUnique({
            where: { id: record.childId },
            select: { isActive: true, pauseReason: true }
        });

        if (!child || !child.isActive) {
            throw new AppError(
                child?.pauseReason || 'Access paused by parent',
                HTTP_STATUS.FORBIDDEN
            );
        }

        return prisma.watchHistory.update({
            where: { id },
            data: { completedWatch: true },
        });
    }

    async getWatchHistory(childId: string, limit = 50) {
        return prisma.watchHistory.findMany({
            where: { childId },
            orderBy: { watchedAt: 'desc' },
            take: limit,
        });
    }

    async getWatchHistoryByDate(childId: string, startDate: Date, endDate: Date) {
        return prisma.watchHistory.findMany({
            where: {
                childId,
                watchedAt: { gte: startDate, lte: endDate },
            },
            orderBy: { watchedAt: 'desc' },
        });
    }

    async logBlockedAttempt(childId: string, parentId: string, data: {
        videoId?: string;
        videoTitle?: string;
        channelId?: string;
        reason?: string;
    }) {
        await prisma.activityLog.create({
            data: {
                childId,
                parentId,
                type: 'blocked_attempt',
                data: data as object,
            },
        });
    }

    async logActivity(childId: string, parentId: string | null, type: string, data: any = {}) {
        return prisma.activityLog.create({
            data: {
                childId,
                parentId: parentId ?? undefined,
                type,
                data,
            },
        });
    }

    async getRecentActivity(childId: string, limit = 20) {
        return prisma.activityLog.findMany({
            where: { childId },
            orderBy: { timestamp: 'desc' },
            take: limit,
        });
    }

    async getTodayWatchTimeSeconds(childId: string): Promise<number> {
        const today = getStartOfLocalDay();

        const history = await prisma.watchHistory.findMany({
            where: {
                childId,
                watchedAt: { gte: today },
                wasBlocked: false,
            },
            select: { watchedDuration: true },
        });

        return history.reduce((sum, h) => sum + (h.watchedDuration ?? 0), 0);
    }

    async getTodayWatchTime(childId: string): Promise<number> {
        const totalSeconds = await this.getTodayWatchTimeSeconds(childId);
        return Math.floor(totalSeconds / 60); // Return floor minutes for accuracy
    }

    async clearHistory(childId: string, parentId: string) {
        const child = await prisma.child.findFirst({ where: { id: childId, parentId } });
        if (!child) throw new AppError('Child not found', HTTP_STATUS.NOT_FOUND);

        await prisma.watchHistory.deleteMany({ where: { childId } });
        return { success: true };
    }
}

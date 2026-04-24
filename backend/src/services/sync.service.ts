import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { HTTP_STATUS } from '../utils/httpStatus';

export class SyncService {

    async syncWatchProgress(childId: string, videoId: string, position: number, deviceId: string) {
        // Check if child is paused before allowing sync
        const child = await prisma.child.findUnique({
            where: { id: childId },
            select: { isActive: true, pauseReason: true }
        });

        if (!child || !child.isActive) {
            throw new AppError(
                child?.pauseReason || 'Access paused by parent',
                HTTP_STATUS.FORBIDDEN
            );
        }

        await prisma.sessionSync.upsert({
            where: { childId },
            create: {
                childId,
                videoId,
                position,
                deviceId,
                startedAt: new Date(),
                lastSyncedAt: new Date(),
            },
            update: {
                videoId,
                position,
                deviceId,
                lastSyncedAt: new Date(),
            },
        });
    }

    async getActiveSession(childId: string) {
        // Check if child is paused before returning active session
        const child = await prisma.child.findUnique({
            where: { id: childId },
            select: { isActive: true, pauseReason: true }
        });

        if (!child || !child.isActive) {
            throw new AppError(
                child?.pauseReason || 'Access paused by parent',
                HTTP_STATUS.FORBIDDEN
            );
        }

        return prisma.sessionSync.findUnique({ where: { childId } });
    }
}

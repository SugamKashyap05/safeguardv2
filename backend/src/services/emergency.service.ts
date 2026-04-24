import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { HTTP_STATUS } from '../utils/httpStatus';

export class EmergencyService {

    async pauseChild(childId: string, reason: string, durationMinutes?: number | null) {
        const pausedUntil = durationMinutes
            ? new Date(Date.now() + durationMinutes * 60_000)
            : null;

        await prisma.child.update({
            where: { id: childId },
            data: { isActive: false, pauseReason: reason, pausedUntil },
        });

        await this.terminateSessions(childId);
        await this.logActivity(childId, 'emergency_pause', { reason, duration: durationMinutes });

        return { success: true, message: 'Child paused' };
    }

    async resumeChild(childId: string) {
        await prisma.child.update({
            where: { id: childId },
            data: { isActive: true, pauseReason: null, pausedUntil: null },
        });

        await this.logActivity(childId, 'emergency_resume', {});
        return { success: true, message: 'Child resumed' };
    }

    async panicPauseAll(parentId: string, reason: string) {
        const children = await prisma.child.findMany({
            where: { parentId },
            select: { id: true },
        });

        if (!children.length) return { success: true, count: 0 };

        const childIds = children.map(c => c.id);

        await prisma.child.updateMany({
            where: { id: { in: childIds } },
            data: { isActive: false, pauseReason: reason, pausedUntil: null },
        });

        await Promise.all(childIds.map(id =>
            Promise.all([
                this.terminateSessions(id),
                this.logActivity(id, 'emergency_panic_pause', { reason }),
            ]),
        ));

        return { success: true, count: childIds.length };
    }

    async panicResumeAll(parentId: string) {
        const children = await prisma.child.findMany({
            where: { parentId },
            select: { id: true },
        });

        if (!children.length) return { success: true, count: 0 };

        const childIds = children.map(c => c.id);

        await prisma.child.updateMany({
            where: { id: { in: childIds } },
            data: { isActive: true, pauseReason: null, pausedUntil: null },
        });

        await Promise.all(childIds.map(id =>
            this.logActivity(id, 'emergency_panic_resume', {}),
        ));

        return { success: true, count: childIds.length };
    }

    async emergencyBlock(childId: string, type: 'video' | 'channel', contentId: string) {
        await prisma.blockedContent.create({
            data: {
                childId,
                reason: 'emergency_block',
                isEmergency: true,
                ...(type === 'video' ? { videoId: contentId } : { channelId: contentId }),
            },
        });

        return { success: true };
    }

    private async terminateSessions(childId: string) {
        await prisma.childSession.updateMany({
            where: { childId, isActive: true },
            data: { isActive: false },
        });
    }

    private async logActivity(childId: string, type: string, data: any) {
        const child = await prisma.child.findUnique({
            where: { id: childId },
            select: { parentId: true },
        });
        if (!child) return;

        await prisma.activityLog.create({
            data: { childId, parentId: child.parentId, type, data },
        });
    }
}

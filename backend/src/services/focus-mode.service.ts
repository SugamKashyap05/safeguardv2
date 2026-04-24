import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { HTTP_STATUS } from '../utils/httpStatus';

export class FocusModeService {

    async activate(childId: string, parentId: string, data: {
        durationMinutes: number;
        reason?: string;
    }) {
        const child = await prisma.child.findFirst({ where: { id: childId, parentId } });
        if (!child) throw new AppError('Child not found', HTTP_STATUS.NOT_FOUND);

        const expiresAt = new Date(Date.now() + data.durationMinutes * 60 * 1000);

        await prisma.activityLog.create({
            data: {
                childId,
                parentId,
                type: 'focus_mode_activated',
                data: { durationMinutes: data.durationMinutes, reason: data.reason, expiresAt },
            },
        });

        // Set a pause
        return prisma.child.update({
            where: { id: childId },
            data: {
                isActive: false,
                pausedUntil: expiresAt,
                pauseReason: data.reason ?? 'Focus mode activated',
            },
        });
    }

    async deactivate(childId: string, parentId: string) {
        const child = await prisma.child.findFirst({ where: { id: childId, parentId } });
        if (!child) throw new AppError('Child not found', HTTP_STATUS.NOT_FOUND);

        return prisma.child.update({
            where: { id: childId },
            data: { isActive: true, pausedUntil: null, pauseReason: null },
        });
    }

    async getStatus(childId: string) {
        const child = await prisma.child.findUnique({
            where: { id: childId },
            select: { isActive: true, pausedUntil: true, pauseReason: true },
        });
        if (!child) throw new AppError('Child not found', HTTP_STATUS.NOT_FOUND);

        const inFocusMode = !child.isActive && child.pauseReason?.includes('Focus mode');
        return {
            isFocusMode: inFocusMode,
            pausedUntil: child.pausedUntil,
            reason: child.pauseReason,
        };
    }
}

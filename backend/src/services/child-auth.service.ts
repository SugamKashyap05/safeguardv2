import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { HTTP_STATUS } from '../utils/httpStatus';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ScreenTimeService } from './screen-time.service';

const screenTimeService = new ScreenTimeService();

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export class ChildAuthService {

    async loginWithPin(childId: string, pin: string, deviceId?: string): Promise<{
        token: string;
        child: object;
    }> {
        const child = await prisma.child.findUnique({
            where: { id: childId },
            select: {
                id: true,
                name: true,
                avatar: true,
                avatarConfig: true,
                pinHash: true,
                isActive: true,
                pausedUntil: true,
                pauseReason: true,
                ageAppropriateLevel: true,
                stars: true,
                parentId: true,
            },
        });

        if (!child) throw new AppError('Child not found', HTTP_STATUS.NOT_FOUND);

        // Check if paused
        if (!child.isActive) {
            if (child.pausedUntil && new Date() > child.pausedUntil) {
                // Auto-resume if pause duration has passed
                await prisma.child.update({
                    where: { id: childId },
                    data: { isActive: true, pausedUntil: null, pauseReason: null },
                });
            } else {
                throw new AppError(
                    child.pauseReason || 'Account is paused by parent',
                    HTTP_STATUS.FORBIDDEN,
                );
            }
        }

        // --- SCREEN TIME RULES CHECK ---
        // 1. Check if it's bedtime
        const isBedtime = await screenTimeService.isBedtime(childId);
        if (isBedtime) {
            throw new AppError(
                "It's past your bedtime! Try again in the morning. 😴",
                HTTP_STATUS.FORBIDDEN
            );
        }

        // 2. Check if within allowed time window
        const isWithinWindow = await screenTimeService.isWithinAllowedWindow(childId);
        if (!isWithinWindow) {
            throw new AppError(
                "You are outside of your allowed playtime window. Check with your parent! 🕒",
                HTTP_STATUS.FORBIDDEN
            );
        }

        // 3. Check if daily limit reached
        const usageStatus = await screenTimeService.getUsageStatus(childId);
        if (usageStatus.isLimitReached) {
            throw new AppError(
                "You've reached your screen time limit for today! 🏁",
                HTTP_STATUS.FORBIDDEN
            );
        }
        // -------------------------------

        const isValid = await bcrypt.compare(pin, child.pinHash);
        if (!isValid) throw new AppError('Invalid PIN', HTTP_STATUS.UNAUTHORIZED);

        // Create session
        const token = jwt.sign(
            { childId: child.id, parentId: child.parentId, type: 'child' },
            env.JWT_SECRET,
            { expiresIn: '24h' },
        );

        const tokenHash = await bcrypt.hash(token, 6);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await prisma.childSession.create({
            data: { childId: child.id, tokenHash, expiresAt },
        });

        const { pinHash: _, ...safeChild } = child;
        return { token, child: safeChild };
    }

    async verifyToken(token: string): Promise<{ childId: string; parentId: string }> {
        try {
            const decoded = jwt.verify(token, env.JWT_SECRET) as {
                childId: string;
                parentId: string;
            };
            return decoded;
        } catch {
            throw new AppError('Invalid or expired token', HTTP_STATUS.UNAUTHORIZED);
        }
    }

    async logout(childId: string, token: string) {
        // Invalidate all active sessions for this child
        await prisma.childSession.updateMany({
            where: { childId, isActive: true },
            data: { isActive: false },
        });
        return { success: true };
    }

    async getActiveChild(childId: string) {
        const child = await prisma.child.findUnique({
            where: { id: childId },
            select: {
                id: true,
                name: true,
                avatar: true,
                avatarConfig: true,
                ageAppropriateLevel: true,
                stars: true,
                isActive: true,
                pausedUntil: true,
                pauseReason: true,
                parentId: true,
                preferences: true,
            },
        });
        if (!child) throw new AppError('Child not found', HTTP_STATUS.NOT_FOUND);
        if (!child.isActive) throw new AppError('Account is paused', HTTP_STATUS.FORBIDDEN);
        return child;
    }

    async terminateSessions(childId: string) {
        await prisma.childSession.updateMany({
            where: { childId, isActive: true },
            data: { isActive: false },
        });
    }
}

import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { HTTP_STATUS } from '../utils/httpStatus';

export class RewardsService {

    async getBalance(childId: string) {
        const child = await prisma.child.findUnique({
            where: { id: childId },
            select: { stars: true },
        });
        if (!child) throw new AppError('Child not found', HTTP_STATUS.NOT_FOUND);
        return { stars: child.stars };
    }

    async award(childId: string, amount: number, reason: string, metadata: any = {}) {
        const [child] = await prisma.$transaction([
            prisma.child.update({
                where: { id: childId },
                data: { stars: { increment: amount } },
            }),
            prisma.rewardTransaction.create({
                data: {
                    childId,
                    type: 'award',
                    amount,
                    balance: 0, // Will be updated below
                    reason,
                    metadata,
                },
            }),
        ]);

        // Update balance in the transaction record
        await prisma.rewardTransaction.updateMany({
            where: { childId, balance: 0 },
            data: { balance: child.stars },
        });

        return { newBalance: child.stars };
    }

    async deduct(childId: string, amount: number, reason: string) {
        const child = await prisma.child.findUnique({
            where: { id: childId },
            select: { stars: true },
        });
        if (!child) throw new AppError('Child not found', HTTP_STATUS.NOT_FOUND);

        if (child.stars < amount) {
            throw new AppError('Insufficient stars', HTTP_STATUS.BAD_REQUEST);
        }

        const [updated] = await prisma.$transaction([
            prisma.child.update({
                where: { id: childId },
                data: { stars: { decrement: amount } },
            }),
            prisma.rewardTransaction.create({
                data: {
                    childId,
                    type: 'deduct',
                    amount: -amount,
                    balance: child.stars - amount,
                    reason,
                },
            }),
        ]);

        return { newBalance: updated.stars };
    }

    async getTransactions(childId: string, limit = 20) {
        return prisma.rewardTransaction.findMany({
            where: { childId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    async getAchievements(childId: string) {
        return prisma.achievement.findMany({
            where: { childId },
            orderBy: { earnedAt: 'desc' },
        });
    }

    async unlockAchievement(childId: string, data: {
        achievementId: string;
        name: string;
        description: string;
        badge?: string;
        starsAwarded: number;
    }) {
        // Check if already unlocked
        const existing = await prisma.achievement.findFirst({
            where: { childId, achievementId: data.achievementId },
        });
        if (existing) return existing;

        const [achievement] = await prisma.$transaction([
            prisma.achievement.create({
                data: {
                    childId,
                    achievementId: data.achievementId,
                    name: data.name,
                    description: data.description,
                    badge: data.badge,
                    starsAwarded: data.starsAwarded,
                },
            }),
            prisma.child.update({
                where: { id: childId },
                data: { stars: { increment: data.starsAwarded } },
            }),
        ]);

        return achievement;
    }

    async checkAndAwardWatchStreak(childId: string, currentStreak: number) {
        const milestones = [3, 7, 14, 30, 60, 100];
        for (const milestone of milestones) {
            if (currentStreak === milestone) {
                await this.unlockAchievement(childId, {
                    achievementId: `streak_${milestone}`,
                    name: `${milestone}-Day Streak!`,
                    description: `Watched content ${milestone} days in a row`,
                    badge: '🔥',
                    starsAwarded: milestone * 2,
                });
            }
        }
    }
}

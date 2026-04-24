import prisma from '../config/prisma';
import { socketService } from './websocket.service';

interface BadgeDefinition {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    rarity: string;
    condition_description: string;
}

const BADGES: Record<string, BadgeDefinition> = {
    first_star: {
        id: 'first_star',
        name: 'First Light',
        description: 'Earned your first star!',
        icon: '🌟',
        category: 'special',
        rarity: 'common',
        condition_description: 'Earn 1 star',
    },
    star_collector: {
        id: 'star_collector',
        name: 'Star Collector',
        description: 'Earned 100 total stars',
        icon: '✨',
        category: 'consistency',
        rarity: 'rare',
        condition_description: 'Earn 100 stars',
    },
};

export class GamificationService {

    async getStats(childId: string) {
        const child = await prisma.child.findUnique({
            where: { id: childId },
            select: { stars: true, totalStarsEarned: true },
        });
        if (!child) throw new Error('Child not found');
        return child;
    }

    async awardStars(childId: string, amount: number, reason: string) {
        if (amount <= 0) return null;

        const child = await prisma.child.update({
            where: { id: childId },
            data: {
                stars: { increment: amount },
                totalStarsEarned: { increment: amount },
            },
            select: { stars: true, totalStarsEarned: true },
        });

        await this.checkStarBadges(childId, child.totalStarsEarned);

        socketService.emitToChild(childId, 'gamification:stars_updated', {
            stars: child.stars,
            total_stars_earned: child.totalStarsEarned,
        });

        return { stars: child.stars, total_stars_earned: child.totalStarsEarned };
    }

    async spendStars(childId: string, amount: number, _reason: string) {
        if (amount <= 0) return false;

        const current = await prisma.child.findUnique({
            where: { id: childId },
            select: { stars: true },
        });
        if (!current) throw new Error('Child not found');
        if (current.stars < amount) throw new Error('Not enough stars');

        const child = await prisma.child.update({
            where: { id: childId },
            data: { stars: { decrement: amount } },
            select: { stars: true },
        });

        socketService.emitToChild(childId, 'gamification:stars_updated', { stars: child.stars });
        return { stars: child.stars };
    }

    async getBadges(childId: string) {
        const earnedBadges = await prisma.childBadge.findMany({
            where: { childId },
        });

        const earnedMap = new Map(earnedBadges.map(b => [b.badgeId, b]));

        return Object.values(BADGES).map(def => ({
            ...def,
            is_earned: earnedMap.has(def.id),
            earned_at: earnedMap.get(def.id)?.earnedAt ?? null,
        }));
    }

    public async checkStarBadges(childId: string, currentTotalStars: number) {
        const toAward: string[] = [];
        if (currentTotalStars >= 1) toAward.push('first_star');
        if (currentTotalStars >= 100) toAward.push('star_collector');

        for (const badgeId of toAward) {
            // createIfNotExists via unique constraint + try/catch
            try {
                await prisma.childBadge.create({
                    data: {
                        childId,
                        badgeId,
                        metadata: { trigger: 'stars_threshold' },
                    },
                });

                socketService.emitToChild(childId, 'gamification:badge_unlocked', {
                    badge: { ...BADGES[badgeId], is_earned: true, earned_at: new Date() },
                });
            } catch {
                // P2002 = unique constraint — badge already earned, ignore
            }
        }
    }
}

export const gamificationService = new GamificationService();

import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { HTTP_STATUS } from '../utils/httpStatus';

export class SubscriptionService {

    async getTier(parentId: string) {
        const parent = await prisma.parent.findUnique({
            where: { id: parentId },
            select: {
                subscriptionTier: true,
            },
        });
        if (!parent) throw new AppError('Parent not found', HTTP_STATUS.NOT_FOUND);
        return parent;
    }

    async setTier(parentId: string, tier: string, expiresAt?: Date) {
        const parent = await prisma.parent.update({
            where: { id: parentId },
            data: {
                subscriptionTier: tier,
            },
        });
        return parent;
    }

    async cancelSubscription(parentId: string) {
        return prisma.parent.update({
            where: { id: parentId },
            data: { subscriptionTier: 'free' },
        });
    }

    async getChildLimit(parentId: string): Promise<number> {
        const parent = await prisma.parent.findUnique({
            where: { id: parentId },
            select: { subscriptionTier: true },
        });

        const limits: Record<string, number> = {
            free: 2,
            premium: 5,
            family: 10,
        };

        return limits[parent?.subscriptionTier ?? 'free'] ?? 2;
    }

    async isFeatureAllowed(parentId: string, feature: string): Promise<boolean> {
        const parent = await prisma.parent.findUnique({
            where: { id: parentId },
            select: { subscriptionTier: true },
        });

        const featureMatrix: Record<string, string[]> = {
            free: ['basic_filters', 'watch_history', 'basic_analytics'],
            premium: ['basic_filters', 'watch_history', 'basic_analytics', 'advanced_analytics', 'screen_time', 'rewards', 'geo_restrictions'],
            family: ['basic_filters', 'watch_history', 'basic_analytics', 'advanced_analytics', 'screen_time', 'rewards', 'geo_restrictions', 'bulk_management', 'custom_channels'],
        };

        const tier = parent?.subscriptionTier ?? 'free';
        return (featureMatrix[tier] ?? featureMatrix.free).includes(feature);
    }
}

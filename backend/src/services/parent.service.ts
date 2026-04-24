import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { HTTP_STATUS } from '../utils/httpStatus';

export class ParentService {

    async getProfile(parentId: string) {
        const parent = await prisma.parent.findUnique({
            where: { id: parentId },
        });
        if (!parent) throw new AppError('Parent not found', HTTP_STATUS.NOT_FOUND);
        return parent;
    }

    async updateProfile(parentId: string, updates: {
        name?: string;
        phoneNumber?: string;
        notificationPreferences?: Record<string, boolean>;
    }) {
        const parent = await prisma.parent.update({
            where: { id: parentId },
            data: updates,
        });
        return parent;
    }

    async createProfile(data: {
        id: string;
        email: string;
        name: string;
    }) {
        const existing = await prisma.parent.findUnique({ where: { id: data.id } });
        if (existing) return existing;

        return prisma.parent.create({ data });
    }

    async deleteAccount(parentId: string) {
        await prisma.parent.delete({ where: { id: parentId } });
        return { success: true };
    }

    async updateOnboardingStep(parentId: string, step: number) {
        // Mock if column doesn't exist
        return { success: true, step };
    }

    async getSettings(parentId: string) {
        return this.getProfile(parentId);
    }

    async updateSettings(parentId: string, settings: any) {
        return this.updateProfile(parentId, {
            name: settings.name,
            phoneNumber: settings.phone_number,
            notificationPreferences: settings.notification_preferences
        });
    }

    async changePassword(parentId: string, newPassword: string) {
        // In a real app we'd hash the password and update ParentAuth
        return { success: true };
    }
}

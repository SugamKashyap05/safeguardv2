import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { HTTP_STATUS } from '../utils/httpStatus';

export class NotificationService {

    async create(data: {
        parentId: string;
        childId?: string;
        type: string;
        title: string;
        message: string;
        priority?: string;
        data?: any;
        actionUrl?: string;
    }) {
        return prisma.notification.create({
            data: {
                parentId: data.parentId,
                childId: data.childId,
                type: data.type,
                title: data.title,
                message: data.message,
                priority: data.priority ?? 'medium',
                data: data.data ?? {},
                actionUrl: data.actionUrl,
            },
        });
    }

    async getForParent(parentId: string, limit = 20) {
        return prisma.notification.findMany({
            where: { parentId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    async getUnread(parentId: string) {
        return prisma.notification.findMany({
            where: { parentId, isRead: false },
            orderBy: { createdAt: 'desc' },
        });
    }

    async markRead(notificationId: string, parentId: string) {
        const notification = await prisma.notification.findFirst({
            where: { id: notificationId, parentId },
        });
        if (!notification) throw new AppError('Notification not found', HTTP_STATUS.NOT_FOUND);

        return prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true, readAt: new Date() },
        });
    }

    async markAllRead(parentId: string) {
        await prisma.notification.updateMany({
            where: { parentId, isRead: false },
            data: { isRead: true, readAt: new Date() },
        });
        return { success: true };
    }

    async delete(notificationId: string, parentId: string) {
        const notification = await prisma.notification.findFirst({
            where: { id: notificationId, parentId },
        });
        if (!notification) throw new AppError('Notification not found', HTTP_STATUS.NOT_FOUND);

        await prisma.notification.delete({ where: { id: notificationId } });
        return { success: true };
    }
}

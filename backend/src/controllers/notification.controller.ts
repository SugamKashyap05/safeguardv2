import { Request, Response } from 'express';
// @ts-ignore
import { NotificationService } from '../services/notification.service';
import { ApiResponse } from '../utils/response';

const service = new NotificationService();

export class NotificationController {

    static async getAll(req: Request, res: Response) {
        // @ts-ignore
        const parentId = req.user.id;
        const { page, limit } = req.query;
        const result = await service.getAll(parentId, Number(page) || 1, Number(limit) || 20);
        return ApiResponse.success(res, result);
    }

    static async getUnreadCount(req: Request, res: Response) {
        // @ts-ignore
        const parentId = req.user.id;
        const result = await service.getUnreadCount(parentId);
        return ApiResponse.success(res, result);
    }

    static async markRead(req: Request, res: Response) {
        const { id } = req.params;
        // @ts-ignore
        const parentId = req.user.id;
        await service.markAsRead(id, parentId);
        return ApiResponse.success(res, null, 'Marked as read');
    }

    static async markAllRead(req: Request, res: Response) {
        // @ts-ignore
        const parentId = req.user.id;
        await service.markAllAsRead(parentId);
        return ApiResponse.success(res, null, 'All marked as read');
    }

    static async delete(req: Request, res: Response) {
        const { id } = req.params;
        // @ts-ignore
        const parentId = req.user.id;
        await service.delete(id, parentId);
        return ApiResponse.success(res, null, 'Notification deleted');
    }

    // For internal testing or admin use
    static async createTest(req: Request, res: Response) {
        // @ts-ignore
        const parentId = req.user.id;
        const { title, message, type } = req.body;
        await service.create({
            parentId,
            title,
            message,
            type: type || 'daily_report'
        });
        return ApiResponse.success(res, null, 'Notification created');
    }
}

import { Request, Response } from 'express';
import { ActivityTrackingService } from '../services/activity-tracking.service';
import { ApiResponse } from '../utils/response';

const service = new ActivityTrackingService();

export class WatchController {

    static async start(req: Request, res: Response) {
        const log = await service.logVideoStart(req.body);
        return ApiResponse.success(res, log, 'Watch started');
    }

    static async update(req: Request, res: Response) {
        const { id } = req.params;
        const { watchedDuration, duration } = req.body;
        const result = await service.updateProgress(id, watchedDuration, duration);
        return ApiResponse.success(res, result, 'Progress updated');
    }

    static async complete(req: Request, res: Response) {
        const { id } = req.params;
        await service.markComplete(id);
        return ApiResponse.success(res, null, 'Marked complete');
    }

    static async getHistory(req: Request, res: Response) {
        const { childId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const result = await service.getHistory(childId, page, limit);
        return ApiResponse.success(res, result);
    }

    static async getStats(req: Request, res: Response) {
        const { childId } = req.params;
        const stats = await service.getStats(childId);
        return ApiResponse.success(res, stats);
    }

    static async getMyHistory(req: Request, res: Response) {
        // @ts-ignore
        const childId = req.child.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const result = await service.getHistory(childId, page, limit);
        return ApiResponse.success(res, result);
    }
}

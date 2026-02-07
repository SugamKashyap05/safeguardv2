import { Request, Response } from 'express';
import { ActivityTrackingService } from '../services/activity-tracking.service';
import { SyncService } from '../services/sync.service';
import { ApiResponse } from '../utils/response';

const service = new ActivityTrackingService();
const syncService = new SyncService();

export class WatchController {

    static async start(req: Request, res: Response) {
        const log = await service.logVideoStart(req.body);

        // --- Live Status Sync ---
        // We track that this child is now watching this video
        try {
            await syncService.syncWatchProgress(
                req.body.childId,
                req.body.videoId,
                0, // Start position
                'unknown' // Device Id not yet passed in body, future enhancement
            );
        } catch (e) {
            console.error('Failed to sync live status', e);
        }

        return ApiResponse.success(res, log, 'Watch started');
    }

    static async update(req: Request, res: Response) {
        const { id } = req.params;
        const { watchedDuration, duration } = req.body;
        // @ts-ignore
        const result = await service.updateProgress(id, watchedDuration, duration);

        // Emit realtime usage update
        if (result.childId && result.todayUsage) {
            // @ts-ignore
            const io = req.app.get('io');
            if (io) {
                io.to(`child_${result.childId}`).emit('usage:updated', {
                    todayUsage: result.todayUsage,
                    childId: result.childId
                });
            }
        }

        // --- Live Status Sync Update ---
        // We assume 'start' set the video. Here we update 'last_synced_at' and 'position'.
        // However, we don't have videoId here easily. 
        // SyncService.syncWatchProgress requires videoId.
        // For MVP, if we don't restart sync in 'update', session might go stale?
        // Let's Skip updating session_sync in 'update' for now to avoid DB read overhead.
        // 'start' is sufficient to say "Watching X".

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

import { Request, Response } from 'express';
import { ContentFilterService } from '../services/content-filter.service';
import { ApiResponse } from '../utils/response';
import { HTTP_STATUS } from '../utils/httpStatus';

const filterService = new ContentFilterService();

export class ContentFilterController {

    /**
     * Check if video is allowed
     */
    static async checkVideo(req: Request, res: Response) {
        const { childId, videoId, title, channelId, duration, description } = req.body;

        // Basic metadata construction
        const metadata = {
            videoId,
            title,
            channelId,
            description,
            durationMinutes: duration ? duration / 60 : undefined
        };

        const result = await filterService.isVideoAllowed(childId, metadata);
        return ApiResponse.success(res, result, result.allowed ? 'Video Allowed' : 'Video Blocked');
    }

    /**
     * Get Settings
     */
    static async getSettings(req: Request, res: Response) {
        const { childId } = req.params;
        const filters = await filterService.getFilters(childId);
        return ApiResponse.success(res, filters, 'Filter settings retrieved');
    }

    /**
     * Update Settings
     */
    static async updateSettings(req: Request, res: Response) {
        const { childId } = req.params;
        const updates = req.body;
        await filterService.updateFilters(childId, updates);
        return ApiResponse.success(res, null, 'Filters updated');
    }

    /**
     * Approve Channel
     */
    static async approveChannel(req: Request, res: Response) {
        const { childId, channelId, channelName } = req.body;
        await filterService.approveChannel(childId, channelId, channelName, req.user.id);
        return ApiResponse.success(res, null, 'Channel approved');
    }

    /**
     * Block Video
     */
    static async blockVideo(req: Request, res: Response) {
        const { childId, videoId, reason } = req.body;
        await filterService.blockVideo(childId, videoId, reason);
        return ApiResponse.success(res, null, 'Video blocked');
    }
}

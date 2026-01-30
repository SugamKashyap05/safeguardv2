import { Request, Response } from 'express';
import { ContentFilterService } from '../services/content-filter.service';
import { ChildService } from '../services/child.service';
import { ApiResponse } from '../utils/response';
import { HTTP_STATUS } from '../utils/httpStatus';

const filterService = new ContentFilterService();
const childService = new ChildService();

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
        const child = await childService.getChild(childId, req.user.id);

        // Map Age Level
        let ageRestriction = 'preschool';
        if (child.age_appropriate_level === 'early-elementary') ageRestriction = 'kids';
        else if (child.age_appropriate_level === 'elementary') ageRestriction = 'tweens';
        else if (child.age_appropriate_level === 'teens') ageRestriction = 'teens';
        else if (child.age_appropriate_level === 'preschool') ageRestriction = 'preschool';

        // Map Output
        const mappedFilters = {
            ageRestriction,
            blockedCategories: filters.blocked_categories || [],
            safeSearch: filters.strict_mode ?? true,
        };

        return ApiResponse.success(res, mappedFilters, 'Filter settings retrieved');
    }

    /**
     * Update Settings
     */
    static async updateSettings(req: Request, res: Response) {
        const { childId } = req.params;
        const { ageRestriction, blockedCategories, safeSearch, ...otherUpdates } = req.body;

        // 1. Update Child Table (Age Level)
        if (ageRestriction) {
            let level = ageRestriction;
            // Map frontend values to DB enum
            if (ageRestriction === 'kids') level = 'early-elementary';
            else if (ageRestriction === 'tweens') level = 'elementary';

            // We use 'any' cast here because updateChild expects Partial<Child> but we are sending a mapped string that might not be in the type definition yet if we didn't update types
            await childService.updateChild(childId, req.user.id, { age_appropriate_level: level } as any);
        }

        // 2. Update Content Filters Table
        const filterUpdates: any = { ...otherUpdates };

        if (blockedCategories) {
            filterUpdates.blocked_categories = blockedCategories;
        }

        if (safeSearch !== undefined) {
            filterUpdates.strict_mode = safeSearch;
        }

        if (Object.keys(filterUpdates).length > 0) {
            await filterService.updateFilters(childId, filterUpdates);
        }

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

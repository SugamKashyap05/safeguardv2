import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { ApiResponse } from '../utils/response';
import { HTTP_STATUS } from '../utils/httpStatus';

const analyticsService = new AnalyticsService();

export class AnalyticsController {

    /**
     * Get child analytics
     * GET /analytics/child/:childId?range=30
     */
    static async getChildAnalytics(req: Request, res: Response) {
        const { childId } = req.params;
        const range = parseInt(req.query.range as string) || 30;

        // Verify parent owns this child
        const parentId = req.user?.id;
        if (!parentId) {
            return ApiResponse.error(res, 'Unauthorized', HTTP_STATUS.UNAUTHORIZED);
        }

        const analytics = await analyticsService.getChildAnalytics(childId, range);

        return ApiResponse.success(res, analytics, 'Child analytics retrieved');
    }

    /**
     * Get parent dashboard analytics (family overview)
     * GET /analytics/parent/dashboard
     */
    static async getParentDashboard(req: Request, res: Response) {
        const parentId = req.user?.id;

        if (!parentId) {
            return ApiResponse.error(res, 'Unauthorized', HTTP_STATUS.UNAUTHORIZED);
        }

        const analytics = await analyticsService.getParentDashboardAnalytics(parentId);

        return ApiResponse.success(res, analytics, 'Parent dashboard analytics retrieved');
    }

    /**
     * Get insights for a specific child
     * GET /analytics/insights/:childId
     */
    static async getInsights(req: Request, res: Response) {
        const { childId } = req.params;
        const parentId = req.user?.id;

        if (!parentId) {
            return ApiResponse.error(res, 'Unauthorized', HTTP_STATUS.UNAUTHORIZED);
        }

        const analytics = await analyticsService.getChildAnalytics(childId, 30);

        return ApiResponse.success(res, { insights: analytics.insights }, 'Insights retrieved');
    }
    /**
     * Get blocked history
     * GET /analytics/blocked/:childId
     */
    static async getBlockedHistory(req: Request, res: Response) {
        const { childId } = req.params;
        const parentId = req.user?.id;

        if (!parentId) {
            return ApiResponse.error(res, 'Unauthorized', HTTP_STATUS.UNAUTHORIZED);
        }

        const history = await analyticsService.getBlockedHistory(childId);
        return ApiResponse.success(res, history, 'Blocked history retrieved');
    }
}

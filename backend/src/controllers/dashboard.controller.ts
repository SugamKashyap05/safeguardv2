import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { ApiResponse } from '../utils/response';

const dashboardService = new DashboardService();

export class DashboardController {
    static async getStats(req: Request, res: Response) {
        const stats = await dashboardService.getStats(req.user.id);
        return ApiResponse.success(res, stats, 'Dashboard stats retrieved');
    }

    static async getActivity(req: Request, res: Response) {
        const activity = await dashboardService.getActivity(req.user.id);
        return ApiResponse.success(res, activity, 'Dashboard activity retrieved');
    }
}

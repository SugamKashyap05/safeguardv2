import { Request, Response } from 'express';
import { ScreenTimeService } from '../services/screen-time.service';
import { ApiResponse } from '../utils/response';

const service = new ScreenTimeService();

export class ScreenTimeController {

    // Get Rules
    static async getRules(req: Request, res: Response) {
        const { childId } = req.params;
        const data = await service.getRules(childId);
        return ApiResponse.success(res, data);
    }

    // Update Rules
    static async updateRules(req: Request, res: Response) {
        const { childId } = req.params;
        await service.updateRules(childId, req.body);
        return ApiResponse.success(res, null, 'Screen time rules updated');
    }

    // Get Remaining Time
    static async getRemaining(req: Request, res: Response) {
        const { childId } = req.params;
        const minutes = await service.checkTimeRemaining(childId);
        return ApiResponse.success(res, { minutes });
    }

    // Extend Time
    static async extendTime(req: Request, res: Response) {
        const { childId } = req.params;
        const { minutes } = req.body; // Default 15 if not passed?
        await service.grantExtraTime(childId, minutes || 15);
        return ApiResponse.success(res, null, `Added ${minutes || 15} minutes`);
    }

    // Pause
    static async pause(req: Request, res: Response) {
        const { childId } = req.params;
        await service.setPauseStatus(childId, true);
        return ApiResponse.success(res, null, 'Child access paused');
    }

    // Resume
    static async resume(req: Request, res: Response) {
        const { childId } = req.params;
        await service.setPauseStatus(childId, false);
        return ApiResponse.success(res, null, 'Child access resumed');
    }
}

import { Request, Response } from 'express';
// @ts-ignore
import { EmergencyService } from '../services/emergency.service';
import { ApiResponse } from '../utils/response';
import { AppError } from '../utils/AppError';
import { HTTP_STATUS } from '../utils/httpStatus';

const service = new EmergencyService();

export class EmergencyController {

    static async pauseChild(req: Request, res: Response) {
        const { childId } = req.params;
        const { reason, duration } = req.body;

        if (!reason) throw new AppError('Reason is required', HTTP_STATUS.BAD_REQUEST);

        const result = await service.pauseChild(childId, reason, duration);
        return ApiResponse.success(res, result);
    }

    static async resumeChild(req: Request, res: Response) {
        const { childId } = req.params;
        const result = await service.resumeChild(childId);
        return ApiResponse.success(res, result);
    }

    static async panicPause(req: Request, res: Response) {
        // @ts-ignore
        const parentId = req.user!.id;
        const { reason } = req.body;

        const result = await service.panicPauseAll(parentId, reason || 'Parent Panic Button');
        return ApiResponse.success(res, result);
    }

    static async panicResume(req: Request, res: Response) {
        // @ts-ignore
        const parentId = req.user!.id;
        const result = await service.panicResumeAll(parentId);
        return ApiResponse.success(res, result);
    }

    static async blockContent(req: Request, res: Response) {
        const { childId, type, id } = req.body;

        if (!childId || !type || !id) throw new AppError('Missing required fields', HTTP_STATUS.BAD_REQUEST);

        const result = await service.emergencyBlock(childId, type, id);
        return ApiResponse.success(res, result);
    }
}

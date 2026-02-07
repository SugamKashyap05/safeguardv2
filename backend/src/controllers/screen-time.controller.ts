import { Request, Response } from 'express';
import { ScreenTimeService } from '../services/screen-time.service';
import { socketService } from '../services/websocket.service';
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

        // Emit realtime update
        console.log(`📡 Emitting settings:updated to child_${childId}`);
        socketService.emitToChild(childId, 'settings:updated', {});
        socketService.emitToChild(childId, 'limits:updated', {}); // Legacy support

        return ApiResponse.success(res, null, 'Screen time rules updated');
    }

    // Get Remaining Time
    static async getRemaining(req: Request, res: Response) {
        const { childId } = req.params;
        const stats = await service.getDetailedStatus(childId);
        return ApiResponse.success(res, { minutes: stats.remaining, ...stats });
    }

    // Extend Time
    static async extendTime(req: Request, res: Response) {
        const { childId } = req.params;
        const { minutes } = req.body; // Default 15 if not passed?
        await service.grantExtraTime(childId, minutes || 15);

        // Realtime update
        console.log(`📡 Emitting settings:updated (extendTime) to child_${childId}`);
        socketService.emitToChild(childId, 'settings:updated', {});

        return ApiResponse.success(res, null, `Added ${minutes || 15} minutes`);
    }

    // Pause
    static async pause(req: Request, res: Response) {
        const { childId } = req.params;
        await service.setPauseStatus(childId, true);

        // Realtime update
        socketService.emitToChild(childId, 'settings:updated', {});

        return ApiResponse.success(res, null, 'Child access paused');
    }

    // Resume
    static async resume(req: Request, res: Response) {
        const { childId } = req.params;
        await service.setPauseStatus(childId, false);

        // Realtime update
        socketService.emitToChild(childId, 'settings:updated', {});

        return ApiResponse.success(res, null, 'Child access resumed');
    }
}

import { Request, Response } from 'express';
// @ts-ignore
import { ChannelService } from '../services/channel.service';
import { ApiResponse } from '../utils/response';

const service = new ChannelService();

export class ChannelController {

    static async getApproved(req: Request, res: Response) {
        const { childId } = req.params;
        const result = await service.getApprovedChannels(childId);
        return ApiResponse.success(res, result);
    }

    static async getPending(req: Request, res: Response) {
        const { childId } = req.params;
        const result = await service.getPendingRequests(childId);
        return ApiResponse.success(res, result);
    }

    static async request(req: Request, res: Response) {
        // Child requests
        const result = await service.requestChannel(req.body);
        return ApiResponse.success(res, result, 'Request sent to parent');
    }

    static async approve(req: Request, res: Response) {
        // Parent approves REQUEST
        const { requestId, notes } = req.body;
        // @ts-ignore
        const parentId = req.user.id;
        await service.approveChannel(requestId, parentId, notes);
        return ApiResponse.success(res, null, 'Channel approved');
    }

    static async directApprove(req: Request, res: Response) {
        // Parent directly approves CHANNEL (no request)
        const { childId, channel } = req.body;
        // @ts-ignore
        const parentId = req.user.id;
        await service.directApprove(childId, channel, parentId);
        return ApiResponse.success(res, null, 'Channel approved');
    }

    static async reject(req: Request, res: Response) {
        const { requestId, notes } = req.body;
        // @ts-ignore
        const parentId = req.user.id;
        await service.rejectChannel(requestId, parentId, notes);
        return ApiResponse.success(res, null, 'Channel rejected');
    }

    static async remove(req: Request, res: Response) {
        const { channelId, childId } = req.params;
        await service.removeChannel(channelId, childId);
        return ApiResponse.success(res, null, 'Channel removed');
    }

    static async discover(req: Request, res: Response) {
        const result = await service.getDiscoveryLists();
        return ApiResponse.success(res, result);
    }
}

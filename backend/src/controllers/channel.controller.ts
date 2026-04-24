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

    static async getMyApproved(req: Request, res: Response) {
        // @ts-ignore
        const childId = req.child.id;
        const result = await service.getApprovedChannels(childId);
        return ApiResponse.success(res, result);
    }

    static async getPending(req: Request, res: Response) {
        // @ts-ignore
        const parentId = req.user.id;
        const result = await service.getPendingRequests(parentId);
        return ApiResponse.success(res, result);
    }

    static async request(req: Request, res: Response) {
        const { childId, channelId, channelName, channelThumbnail, childMessage } = req.body;
        const result = await service.requestApproval(childId, { channelId, channelName, channelThumbnail, childMessage });
        return ApiResponse.success(res, result, 'Request sent to parent');
    }

    static async approve(req: Request, res: Response) {
        const { requestId, childId, channelId, channelName, thumbnail } = req.body;
        // @ts-ignore
        const parentId = req.user.id;
        // In reality, we'd update ApprovalRequest and then add to approved.
        const result = await service.approveChannel(childId, channelId, channelName, parentId, thumbnail);
        return ApiResponse.success(res, result, 'Channel approved');
    }

    static async directApprove(req: Request, res: Response) {
        const { childId, channelId, channelName, thumbnail } = req.body;
        // @ts-ignore
        const parentId = req.user.id;
        const result = await service.approveChannel(childId, channelId, channelName, parentId, thumbnail);
        return ApiResponse.success(res, result, 'Channel approved');
    }

    static async reject(req: Request, res: Response) {
        const { requestId } = req.body;
        // Normally we'd find the ApprovalRequest and set to rejected here
        // Just mock it since we don't have reject in service
        return ApiResponse.success(res, null, 'Channel rejected');
    }

    static async remove(req: Request, res: Response) {
        const { channelId, childId } = req.params;
        // @ts-ignore
        const parentId = req.user.id;
        await service.removeApprovedChannel(childId, channelId, parentId);
        return ApiResponse.success(res, null, 'Channel removed');
    }

    static async discover(req: Request, res: Response) {
        // Mock discovery lists for now
        const result = { recommendations: [] };
        return ApiResponse.success(res, result);
    }
}

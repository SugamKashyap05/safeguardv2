import { Request, Response } from 'express';
import { ApprovalService } from '../services/approval.service';
import { ApiResponse } from '../utils/response';
import { HTTP_STATUS } from '../utils/httpStatus';

const approvalService = new ApprovalService();

export class ApprovalController {

    /**
     * Child requests video approval
     * POST /approvals/request
     */
    static async requestApproval(req: Request, res: Response) {
        const { videoId, videoTitle, videoThumbnail, channelId, channelName, duration, message, requestType } = req.body;
        const childId = (req as any).child?.id || (req as any).child?.childId;

        if (!childId) {
            return ApiResponse.error(res, 'Unauthorized', HTTP_STATUS.UNAUTHORIZED);
        }

        if (requestType === 'channel') {
            const request = await approvalService.requestChannelApproval(
                childId,
                channelId,
                channelName,
                req.body.channelThumbnail,
                message
            );
            return ApiResponse.success(res, request, 'Channel approval requested');
        }

        // Video approval request
        const request = await approvalService.requestVideoApproval(
            childId,
            {
                videoId,
                title: videoTitle,
                thumbnail: videoThumbnail,
                channelId,
                channelName,
                duration
            },
            message
        );

        return ApiResponse.success(res, request, 'Video approval requested');
    }

    /**
     * Parent gets pending requests
     * GET /approvals/pending
     */
    static async getPending(req: Request, res: Response) {
        const parentId = req.user?.id;

        if (!parentId) {
            return ApiResponse.error(res, 'Unauthorized', HTTP_STATUS.UNAUTHORIZED);
        }

        const requests = await approvalService.getPendingRequests(parentId);
        const count = await approvalService.getPendingCount(parentId);

        return ApiResponse.success(res, { requests, count }, 'Pending requests retrieved');
    }

    /**
     * Parent gets approval history
     * GET /approvals/history
     */
    static async getHistory(req: Request, res: Response) {
        const parentId = req.user?.id;
        const { status } = req.query;

        if (!parentId) {
            return ApiResponse.error(res, 'Unauthorized', HTTP_STATUS.UNAUTHORIZED);
        }

        const requests = await approvalService.getRequestHistory(parentId, status as string);

        return ApiResponse.success(res, requests, 'Approval history retrieved');
    }

    /**
     * Parent reviews (approves/rejects) a request
     * POST /approvals/:id/review
     */
    static async review(req: Request, res: Response) {
        const parentId = req.user?.id;
        const { id } = req.params;
        const { decision, notes } = req.body;

        if (!parentId) {
            return ApiResponse.error(res, 'Unauthorized', HTTP_STATUS.UNAUTHORIZED);
        }

        if (!['approve', 'reject'].includes(decision)) {
            return ApiResponse.error(res, 'Decision must be approve or reject', HTTP_STATUS.BAD_REQUEST);
        }

        const request = await approvalService.reviewRequest(id, decision, parentId, notes);

        return ApiResponse.success(res, request, `Request ${decision}d`);
    }

    /**
     * Parent quick approves video + channel
     * POST /approvals/:id/quick-approve-channel
     */
    static async quickApproveChannel(req: Request, res: Response) {
        const parentId = req.user?.id;
        const { id } = req.params;

        if (!parentId) {
            return ApiResponse.error(res, 'Unauthorized', HTTP_STATUS.UNAUTHORIZED);
        }

        const result = await approvalService.quickApproveChannel(id, parentId);

        return ApiResponse.success(res, result, 'Video and channel approved');
    }

    /**
     * Parent dismisses/deletes a request
     * DELETE /approvals/:id
     */
    static async dismiss(req: Request, res: Response) {
        const parentId = req.user?.id;
        const { id } = req.params;

        if (!parentId) {
            return ApiResponse.error(res, 'Unauthorized', HTTP_STATUS.UNAUTHORIZED);
        }

        await approvalService.dismissRequest(id, parentId);

        return ApiResponse.success(res, null, 'Request dismissed');
    }

    /**
     * Get pending count (for badge)
     * GET /approvals/count
     */
    static async getCount(req: Request, res: Response) {
        const parentId = req.user?.id;

        if (!parentId) {
            return ApiResponse.error(res, 'Unauthorized', HTTP_STATUS.UNAUTHORIZED);
        }

        const count = await approvalService.getPendingCount(parentId);

        return ApiResponse.success(res, { count }, 'Pending count retrieved');
    }
}

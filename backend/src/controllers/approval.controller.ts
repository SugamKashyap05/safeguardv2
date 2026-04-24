import { Request, Response } from 'express';
import { ApprovalService } from '../services/approval.service';
import { ChannelService } from '../services/channel.service';
import { ApiResponse } from '../utils/response';
import { HTTP_STATUS } from '../utils/httpStatus';
import prisma from '../config/prisma';

const approvalService = new ApprovalService();
const channelService = new ChannelService();

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
            const request = await channelService.requestApproval(
                childId,
                {
                    channelId,
                    channelName,
                    channelThumbnail: req.body.channelThumbnail,
                    childMessage: message
                }
            );
            return ApiResponse.success(res, request, 'Channel approval requested');
        }

        // Video approval request
        const request = await approvalService.requestVideoApproval(
            childId,
            {
                videoId,
                videoTitle,
                videoThumbnail,
                channelId,
                channelName,
                childMessage: message
            }
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
        const count = requests.length;

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

        // getRequestHistory isn't available, we can mock or do a prisma call
        let requests: any[] = [];
        if (parentId) {
            requests = await prisma.approvalRequest.findMany({
                where: { 
                    child: { parentId },
                    status: status ? (status as string) : { not: 'pending' }
                },
                include: { child: { select: { name: true, avatar: true } } },
                orderBy: { requestedAt: 'desc' },
            });
        }

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

        const request = await approvalService.reviewRequest(id, parentId, 'approved');
        const result = { success: true, request };

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

        const request = await prisma.approvalRequest.findUnique({ where: { id }, include: { child: true } });
        if (request && request.child.parentId === parentId) {
            await prisma.approvalRequest.delete({ where: { id } });
        }

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

        const requests = await approvalService.getPendingRequests(parentId);
        const count = requests.length;

        return ApiResponse.success(res, { count }, 'Pending count retrieved');
    }
}

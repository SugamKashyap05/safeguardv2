import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { HTTP_STATUS } from '../utils/httpStatus';

export class ApprovalService {

    async requestVideoApproval(childId: string, data: {
        videoId: string;
        videoTitle: string;
        videoThumbnail?: string;
        channelId?: string;
        channelName?: string;
        childMessage?: string;
    }) {
        // Check if already pending
        const existing = await prisma.approvalRequest.findFirst({
            where: { childId, videoId: data.videoId, status: 'pending' },
        });
        if (existing) throw new AppError('Approval already requested for this video', HTTP_STATUS.CONFLICT);

        const child = await prisma.child.findUnique({
            where: { id: childId },
            select: { parentId: true },
        });
        if (!child) throw new AppError('Child not found', HTTP_STATUS.NOT_FOUND);

        const request = await prisma.approvalRequest.create({
            data: {
                childId,
                requestType: 'video',
                videoId: data.videoId,
                videoTitle: data.videoTitle,
                videoThumbnail: data.videoThumbnail,
                channelId: data.channelId,
                channelName: data.channelName,
                childMessage: data.childMessage,
            },
        });

        // Create notification for parent
        await prisma.notification.create({
            data: {
                parentId: child.parentId,
                childId,
                type: 'approval_request',
                title: 'New Approval Request',
                message: `Your child wants to watch: ${data.videoTitle}`,
                priority: 'medium',
                data: { requestId: request.id } as object,
                actionUrl: `/approvals/${request.id}`,
            },
        });

        return request;
    }

    async getPendingRequests(parentId: string) {
        const children = await prisma.child.findMany({
            where: { parentId },
            select: { id: true },
        });
        const childIds = children.map(c => c.id);

        return prisma.approvalRequest.findMany({
            where: { childId: { in: childIds }, status: 'pending' },
            include: { child: { select: { name: true, avatar: true } } },
            orderBy: { requestedAt: 'desc' },
        });
    }

    async getRequestsForChild(childId: string) {
        return prisma.approvalRequest.findMany({
            where: { childId },
            orderBy: { requestedAt: 'desc' },
        });
    }

    async reviewRequest(requestId: string, parentId: string, decision: 'approved' | 'rejected', parentNotes?: string) {
        const request = await prisma.approvalRequest.findUnique({
            where: { id: requestId },
            include: { child: true },
        });

        if (!request) throw new AppError('Request not found', HTTP_STATUS.NOT_FOUND);
        if (request.child.parentId !== parentId) throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN);
        if (request.status !== 'pending') throw new AppError('Request already reviewed', HTTP_STATUS.CONFLICT);

        const updated = await prisma.approvalRequest.update({
            where: { id: requestId },
            data: {
                status: decision,
                reviewedAt: new Date(),
                reviewedBy: parentId,
                parentNotes,
            },
        });

        // If approved video request, add to approved_videos
        if (decision === 'approved' && request.requestType === 'video' && request.videoId) {
            await prisma.approvedVideo.upsert({
                where: { childId_videoId: { childId: request.childId, videoId: request.videoId } },
                update: {},
                create: {
                    childId: request.childId,
                    videoId: request.videoId,
                    videoTitle: request.videoTitle ?? '',
                    videoThumbnail: request.videoThumbnail ?? undefined,
                    approvedBy: parentId,
                },
            });
        }

        // If approved channel request, add to approved_channels
        if (decision === 'approved' && request.requestType === 'channel' && request.channelId) {
            await prisma.approvedChannel.upsert({
                where: { childId_channelId: { childId: request.childId, channelId: request.channelId } },
                update: {},
                create: {
                    childId: request.childId,
                    channelId: request.channelId,
                    channelName: request.channelName ?? '',
                    approvedBy: parentId,
                },
            });
        }

        return updated;
    }

    async getRequest(requestId: string) {
        return prisma.approvalRequest.findUnique({
            where: { id: requestId },
            include: { child: { select: { name: true, avatar: true } } },
        });
    }
}

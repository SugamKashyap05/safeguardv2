import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { HTTP_STATUS } from '../utils/httpStatus';

export class ChannelService {

    async requestApproval(childId: string, data: {
        channelId: string;
        channelName: string;
        channelThumbnail?: string;
        childMessage?: string;
    }) {
        // Check if already pending or approved
        const existing = await prisma.approvalRequest.findFirst({
            where: {
                childId,
                channelId: data.channelId,
                status: 'pending',
            },
        });
        if (existing) throw new AppError('Approval already pending for this channel', HTTP_STATUS.CONFLICT);

        const alreadyApproved = await prisma.approvedChannel.findFirst({
            where: { childId, channelId: data.channelId },
        });
        if (alreadyApproved) throw new AppError('Channel already approved', HTTP_STATUS.CONFLICT);

        return prisma.approvalRequest.create({
            data: {
                childId,
                requestType: 'channel',
                channelId: data.channelId,
                channelName: data.channelName,
                channelThumbnail: data.channelThumbnail,
                childMessage: data.childMessage,
            },
        });
    }

    async getApprovedChannels(childId: string) {
        return prisma.approvedChannel.findMany({
            where: { childId },
            orderBy: { approvedAt: 'desc' },
        });
    }

    async approveChannel(childId: string, channelId: string, channelName: string, approverId: string, thumbnail?: string) {
        return prisma.approvedChannel.upsert({
            where: { childId_channelId: { childId, channelId } },
            update: { approvedBy: approverId, approvedAt: new Date() },
            create: {
                childId,
                channelId,
                channelName,
                channelThumbnail: thumbnail,
                approvedBy: approverId,
            },
        });
    }

    async removeApprovedChannel(childId: string, channelId: string, parentId: string) {
        // Verify parent owns this child
        const child = await prisma.child.findFirst({ where: { id: childId, parentId } });
        if (!child) throw new AppError('Child not found', HTTP_STATUS.NOT_FOUND);

        const channel = await prisma.approvedChannel.findFirst({
            where: { childId, channelId },
        });
        if (!channel) throw new AppError('Approved channel not found', HTTP_STATUS.NOT_FOUND);

        await prisma.approvedChannel.delete({ where: { id: channel.id } });
        return { success: true };
    }

    async getPendingRequests(parentId: string) {
        // Get all children for this parent
        const children = await prisma.child.findMany({
            where: { parentId },
            select: { id: true },
        });
        const childIds = children.map(c => c.id);

        return prisma.approvalRequest.findMany({
            where: {
                childId: { in: childIds },
                requestType: 'channel',
                status: 'pending',
            },
            include: { child: { select: { name: true } } },
            orderBy: { requestedAt: 'desc' },
        });
    }
}

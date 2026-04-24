import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { HTTP_STATUS } from '../utils/httpStatus';

interface VideoMetadata {
    videoId: string;
    title: string;
    description?: string;
    channelId: string;
    durationMinutes?: number;
    tags?: string[];
    categoryId?: string;
}

export class ContentFilterService {

    async isVideoAllowed(childId: string, video: VideoMetadata): Promise<{ allowed: boolean; reason?: string }> {
        // 1. Explicit whitelist check
        const approvedVideo = await prisma.approvedVideo.findFirst({
            where: { childId, videoId: video.videoId },
        });
        if (approvedVideo) return { allowed: true, reason: 'Explicitly approved by parent' };

        // 2. Explicit blacklist check
        const blocked = await prisma.blockedContent.findFirst({
            where: {
                childId,
                OR: [
                    { videoId: video.videoId },
                    { channelId: video.channelId },
                ],
            },
        });
        if (blocked) return { allowed: false, reason: blocked.reason ?? 'Blocked by parent' };

        // 3. Get child + filters
        const child = await prisma.child.findUnique({
            where: { id: childId },
            select: { ageAppropriateLevel: true, age: true },
        });
        if (!child) throw new AppError('Child not found', HTTP_STATUS.NOT_FOUND);

        const filters = await prisma.contentFilter.findUnique({ where: { childId } });

        // 4. Check approved channels
        const isChannelApproved = await this.isChannelApproved(video.channelId, childId);

        // 5. Strict mode
        if (filters?.strictMode && !isChannelApproved) {
            return { allowed: false, reason: 'Strict mode: Channel not in approved list' };
        }

        // 6. Duration limit
        if (video.durationMinutes && filters?.maxVideoDurationMinutes) {
            if (video.durationMinutes > filters.maxVideoDurationMinutes) {
                return { allowed: false, reason: `Video is too long (> ${filters.maxVideoDurationMinutes}m)` };
            }
        }

        // 7. Blocked keywords
        if (filters?.blockedKeywords && filters.blockedKeywords.length > 0) {
            const text = `${video.title} ${video.description ?? ''} ${video.tags?.join(' ') ?? ''}`;
            if (await this.containsBlockedKeywords(text, filters.blockedKeywords)) {
                return { allowed: false, reason: 'Contains blocked keywords' };
            }
        }

        // 8. Age appropriateness
        const ageCheck = await this.checkAgeAppropriateness(child.ageAppropriateLevel, video);
        if (!ageCheck.allowed) return ageCheck;

        return { allowed: true };
    }

    async isChannelApproved(channelId: string, childId: string): Promise<boolean> {
        const approved = await prisma.approvedChannel.findFirst({
            where: { childId, channelId },
        });
        return !!approved;
    }

    async checkText(text: string, childId: string): Promise<{ allowed: boolean; reason?: string }> {
        const filters = await prisma.contentFilter.findUnique({
            where: { childId },
            select: { blockedKeywords: true },
        });

        if (filters?.blockedKeywords && filters.blockedKeywords.length > 0) {
            if (await this.containsBlockedKeywords(text, filters.blockedKeywords)) {
                return { allowed: false, reason: 'Contains blocked keywords' };
            }
        }
        return { allowed: true };
    }

    async containsBlockedKeywords(text: string, keywords: string[]): Promise<boolean> {
        const lower = text.toLowerCase();
        return keywords.some(kw => lower.includes(kw.toLowerCase()));
    }

    async getFilters(childId: string) {
        let filters = await prisma.contentFilter.findUnique({ where: { childId } });

        if (!filters) {
            const child = await prisma.child.findUnique({ where: { id: childId } });
            if (!child) throw new AppError('Child not found', HTTP_STATUS.NOT_FOUND);

            filters = await prisma.contentFilter.create({ data: { childId } });
        }

        return filters;
    }

    async updateFilters(childId: string, updates: {
        blockedKeywords?: string[];
        blockedCategories?: string[];
        allowedCategories?: string[];
        maxVideoDurationMinutes?: number;
        allowComments?: boolean;
        strictMode?: boolean;
    }) {
        await prisma.contentFilter.upsert({
            where: { childId },
            update: updates,
            create: { childId, ...updates },
        });
        return true;
    }

    async blockVideo(childId: string, videoId: string, reason?: string) {
        return prisma.blockedContent.create({
            data: { childId, videoId, reason },
        });
    }

    async approveChannel(childId: string, channelId: string, channelName: string, approverId: string) {
        return prisma.approvedChannel.upsert({
            where: { childId_channelId: { childId, channelId } },
            update: { approvedBy: approverId, approvedAt: new Date() },
            create: { childId, channelId, channelName, approvedBy: approverId },
        });
    }

    async blockChannel(childId: string, channelId: string, reason?: string) {
        const { PlaylistService } = await import('./playlist.service');

        await prisma.blockedContent.create({
            data: {
                childId,
                channelId,
                reason: reason ?? 'Blocked by parent',
            },
        });

        await PlaylistService.removeVideosByChannel(childId, channelId);
    }

    private async checkAgeAppropriateness(
        level: string,
        video: VideoMetadata,
    ): Promise<{ allowed: boolean; reason?: string }> {
        if (level === 'preschool') {
            if (video.durationMinutes && video.durationMinutes > 10) {
                return { allowed: false, reason: 'Preschool: Max 10 mins' };
            }
            const unsafe = ['scary', 'spooky', 'ghost', 'zombie', 'love', 'kiss', 'dating', 'boyfriend', 'girlfriend'];
            if (new RegExp(unsafe.join('|'), 'i').test(video.title)) {
                return { allowed: false, reason: 'Found inappropriate keyword for preschool' };
            }
        }

        if (level === 'early-elementary') {
            if (video.durationMinutes && video.durationMinutes > 15) {
                return { allowed: false, reason: 'Early Elementary: Max 15 mins' };
            }
        }

        return { allowed: true };
    }
}

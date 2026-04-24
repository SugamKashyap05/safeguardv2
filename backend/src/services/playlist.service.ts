import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { HTTP_STATUS } from '../utils/httpStatus';

export class PlaylistService {

    async getPlaylists(childId: string) {
        return prisma.playlist.findMany({
            where: { childId },
            include: { _count: { select: { items: true } } },
            orderBy: { createdAt: 'asc' },
        });
    }

    async getPlaylist(playlistId: string, childId: string) {
        const playlist = await prisma.playlist.findFirst({
            where: { id: playlistId, childId },
            include: { items: { orderBy: { position: 'asc' } } },
        });
        if (!playlist) throw new AppError('Playlist not found', HTTP_STATUS.NOT_FOUND);
        return playlist;
    }

    async createPlaylist(childId: string, data: {
        name: string;
        description?: string;
        type?: string;
        thumbnail?: string;
    }) {
        // Map types to Enum values (USER_CREATED, WATCH_LATER, FAVORITES, RECOMMENDED)
        let playlistType: 'USER_CREATED' | 'WATCH_LATER' | 'FAVORITES' | 'RECOMMENDED' = 'USER_CREATED';
        if (data.type?.toUpperCase() === 'FAVORITES') playlistType = 'FAVORITES';
        if (data.type?.toUpperCase() === 'WATCH_LATER') playlistType = 'WATCH_LATER';
        if (data.type?.toUpperCase() === 'RECOMMENDED') playlistType = 'RECOMMENDED';

        return prisma.playlist.create({
            data: {
                childId,
                name: data.name,
                description: data.description,
                type: playlistType,
                thumbnail: data.thumbnail,
            },
        });
    }

    async updatePlaylist(playlistId: string, childId: string, updates: {
        name?: string;
        description?: string;
        thumbnail?: string;
    }) {
        const playlist = await prisma.playlist.findFirst({ where: { id: playlistId, childId } });
        if (!playlist) throw new AppError('Playlist not found', HTTP_STATUS.NOT_FOUND);

        return prisma.playlist.update({ where: { id: playlistId }, data: updates });
    }

    async deletePlaylist(playlistId: string, childId: string) {
        const playlist = await prisma.playlist.findFirst({ where: { id: playlistId, childId } });
        if (!playlist) throw new AppError('Playlist not found', HTTP_STATUS.NOT_FOUND);
        if (playlist.isDefault) throw new AppError('Cannot delete default playlist', HTTP_STATUS.FORBIDDEN);

        await prisma.playlist.delete({ where: { id: playlistId } });
        return { success: true };
    }

    async addVideo(playlistId: string, childId: string, data: {
        videoId: string;
        videoMetadata?: any;
    }) {
        const playlist = await prisma.playlist.findFirst({ where: { id: playlistId, childId } });
        if (!playlist) throw new AppError('Playlist not found', HTTP_STATUS.NOT_FOUND);

        // Get next position
        const lastItem = await prisma.playlistItem.findFirst({
            where: { playlistId },
            orderBy: { position: 'desc' },
        });
        const position = (lastItem?.position ?? -1) + 1;

        return prisma.playlistItem.upsert({
            where: { playlistId_videoId: { playlistId, videoId: data.videoId } },
            update: { videoMetadata: data.videoMetadata ?? {} },
            create: {
                playlistId,
                videoId: data.videoId,
                position,
                videoMetadata: data.videoMetadata ?? {},
            },
        });
    }

    async removeVideo(playlistId: string, childId: string, videoId: string) {
        const playlist = await prisma.playlist.findFirst({ where: { id: playlistId, childId } });
        if (!playlist) throw new AppError('Playlist not found', HTTP_STATUS.NOT_FOUND);

        const item = await prisma.playlistItem.findFirst({
            where: { playlistId, videoId },
        });
        if (!item) throw new AppError('Video not in playlist', HTTP_STATUS.NOT_FOUND);

        await prisma.playlistItem.delete({ where: { id: item.id } });
        return { success: true };
    }

    async reorderPlaylist(playlistId: string, childId: string, videoIds: string[]) {
        const playlist = await prisma.playlist.findFirst({ where: { id: playlistId, childId } });
        if (!playlist) throw new AppError('Playlist not found', HTTP_STATUS.NOT_FOUND);

        // Update positions in a transaction
        await prisma.$transaction(
            videoIds.map((videoId, index) =>
                prisma.playlistItem.updateMany({
                    where: { playlistId, videoId },
                    data: { position: index },
                }),
            ),
        );
        return { success: true };
    }

    async toggleFavorite(childId: string, videoId: string, videoMetadata?: any): Promise<{
        isFavorited: boolean;
    }> {
        // Get or create Favorites playlist
        let favPlaylist = await prisma.playlist.findFirst({
            where: { childId, type: 'FAVORITES' },
        });

        if (!favPlaylist) {
            favPlaylist = await prisma.playlist.create({
                data: { childId, name: 'Favorites', type: 'FAVORITES', isDefault: true },
            });
        }

        // Check if video is already in favorites
        const existing = await prisma.playlistItem.findFirst({
            where: { playlistId: favPlaylist.id, videoId },
        });

        if (existing) {
            await prisma.playlistItem.delete({ where: { id: existing.id } });
            return { isFavorited: false };
        }

        const lastItem = await prisma.playlistItem.findFirst({
            where: { playlistId: favPlaylist.id },
            orderBy: { position: 'desc' },
        });

        await prisma.playlistItem.create({
            data: {
                playlistId: favPlaylist.id,
                videoId,
                position: (lastItem?.position ?? -1) + 1,
                videoMetadata: videoMetadata ?? {},
            },
        });

        return { isFavorited: true };
    }

    async getFavorites(childId: string) {
        const favPlaylist = await prisma.playlist.findFirst({
            where: { childId, type: 'FAVORITES' },
            include: { items: { orderBy: { position: 'asc' } } },
        });
        return favPlaylist?.items ?? [];
    }

    async isVideoFavorited(childId: string, videoId: string): Promise<boolean> {
        const favPlaylist = await prisma.playlist.findFirst({
            where: { childId, type: 'FAVORITES' },
        });
        if (!favPlaylist) return false;

        const item = await prisma.playlistItem.findFirst({
            where: { playlistId: favPlaylist.id, videoId },
        });
        return !!item;
    }

    // Static method for content-filter.service.ts
    static async removeVideosByChannel(childId: string, channelId: string) {
        // Find all playlists for this child
        const playlists = await prisma.playlist.findMany({
            where: { childId },
            select: { id: true },
        });
        const playlistIds = playlists.map(p => p.id);

        if (playlistIds.length === 0) return;

        // Get items where metadata contains this channelId
        const items = await prisma.playlistItem.findMany({
            where: { playlistId: { in: playlistIds } },
        });

        // Filter items by channelId in metadata
        const toDelete = items.filter(item => {
            const meta = item.videoMetadata as any;
            return meta?.channelId === channelId;
        });

        if (toDelete.length === 0) return;

        await prisma.playlistItem.deleteMany({
            where: { id: { in: toDelete.map(i => i.id) } },
        });
    }
}

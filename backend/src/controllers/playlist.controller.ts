import { Request, Response } from 'express';
import { PlaylistService } from '../services/playlist.service';
import { AppError } from '../utils/AppError';

const service = new PlaylistService();

export class PlaylistController {

    static async getPlaylists(req: Request, res: Response) {
        const { childId } = req.params;
        const playlists = await service.getPlaylists(childId);
        res.json({ success: true, data: playlists });
    }

    static async getPlaylistById(req: Request, res: Response) {
        const { id } = req.params;
        const childId = req.query.childId as string || (req as any).child?.id;
        const playlist = await service.getPlaylist(id, childId);
        res.json({ success: true, data: playlist });
    }

    static async createPlaylist(req: Request, res: Response) {
        const { childId, name, description } = req.body;
        if (!childId || !name) throw new AppError('Child ID and Name are required', 400);

        const playlist = await service.createPlaylist(childId, { name, description });
        res.status(201).json({ success: true, data: playlist });
    }

    static async addToPlaylist(req: Request, res: Response) {
        const { id } = req.params; 
        const childId = req.body.childId || (req as any).child?.id;
        const { videoId, ...metadata } = req.body;

        if (!videoId) throw new AppError('Video ID is required', 400);

        const item = await service.addVideo(id, childId, { videoId, videoMetadata: metadata });
        res.status(201).json({ success: true, data: item });
    }

    static async removeFromPlaylist(req: Request, res: Response) {
        const { id, videoId } = req.params;
        const childId = req.query.childId as string || (req as any).child?.id;
        await service.removeVideo(id, childId, videoId);
        res.json({ success: true, message: 'Removed from playlist' });
    }

    static async deletePlaylist(req: Request, res: Response) {
        const { id } = req.params;
        const childId = req.query.childId as string || (req as any).child?.id;
        await service.deletePlaylist(id, childId);
        res.json({ success: true, message: 'Playlist deleted' });
    }

    static async toggleFavorite(req: Request, res: Response) {
        const { childId, videoId, ...metadata } = req.body;
        if (!childId || !videoId) throw new AppError('Child ID and Video ID are required', 400);

        const isFavorited = await service.toggleFavorite(childId, videoId, metadata);
        res.json({ success: true, isFavorited });
    }

    static async checkFavorite(req: Request, res: Response) {
        const { childId, videoId } = req.query;
        if (!childId || !videoId) throw new AppError('Missing params', 400);

        const isFavorited = await service.isVideoFavorited(childId as string, videoId as string);
        res.json({ success: true, isFavorited });
    }

    static async reorderItems(req: Request, res: Response) {
        const { id } = req.params;
        const { orderedIds, childId } = req.body;

        if (!orderedIds || !Array.isArray(orderedIds)) {
            throw new AppError('orderedIds array is required', 400);
        }

        await service.reorderPlaylist(id, childId || (req as any).child?.id, orderedIds);
        res.json({ success: true, message: 'Playlist reordered' });
    }

    static async discover(req: Request, res: Response) {
        const childId = req.query.childId as string;
        // Mock discovery logic for now
        res.json({ success: true, data: [] });
    }
}

import { Request, Response } from 'express';
import { PlaylistService } from '../services/playlist.service';
import { AppError } from '../utils/AppError';

export class PlaylistController {

    static async getPlaylists(req: Request, res: Response) {
        const { childId } = req.params;

        // Validation: Verify parent has access to child or child is accessing own playlist
        // Ignoring for now assuming auth middleware handles high level scope or we need child_id specific check

        const playlists = await PlaylistService.getPlaylists(childId);
        res.json({ success: true, data: playlists });
    }

    static async getPlaylistById(req: Request, res: Response) {
        const { id } = req.params;
        const playlist = await PlaylistService.getPlaylistById(id);
        res.json({ success: true, data: playlist });
    }

    static async createPlaylist(req: Request, res: Response) {
        const { childId, name, description } = req.body;

        if (!childId || !name) throw new AppError('Child ID and Name are required', 400);

        const playlist = await PlaylistService.createPlaylist(childId, name, description);
        res.status(201).json({ success: true, data: playlist });
    }

    static async addToPlaylist(req: Request, res: Response) {
        const { id } = req.params; // playlistId
        const { videoId, ...metadata } = req.body;

        if (!videoId) throw new AppError('Video ID is required', 400);

        const item = await PlaylistService.addToPlaylist(id, videoId, metadata);
        res.status(201).json({ success: true, data: item });
    }

    static async removeFromPlaylist(req: Request, res: Response) {
        const { id, videoId } = req.params;
        await PlaylistService.removeFromPlaylist(id, videoId);
        res.json({ success: true, message: 'Removed from playlist' });
    }

    static async deletePlaylist(req: Request, res: Response) {
        const { id } = req.params;
        await PlaylistService.deletePlaylist(id);
        res.json({ success: true, message: 'Playlist deleted' });
    }

    static async toggleFavorite(req: Request, res: Response) {
        const { childId, videoId, ...metadata } = req.body;

        if (!childId || !videoId) throw new AppError('Child ID and Video ID are required', 400);

        const isFavorited = await PlaylistService.toggleFavorite(childId, videoId, metadata);
        res.json({ success: true, isFavorited });
    }

    static async checkFavorite(req: Request, res: Response) {
        const { childId, videoId } = req.query;
        if (!childId || !videoId) throw new AppError('Missing params', 400);

        const isFavorited = await PlaylistService.isFavorited(childId as string, videoId as string);
        res.json({ success: true, isFavorited });
    }

    static async reorderItems(req: Request, res: Response) {
        const { id } = req.params;
        const { orderedIds } = req.body;

        if (!orderedIds || !Array.isArray(orderedIds)) {
            throw new AppError('orderedIds array is required', 400);
        }

        await PlaylistService.reorderItems(id, orderedIds);
        res.json({ success: true, message: 'Playlist reordered' });
    }
}

import { api } from './api';
import { Playlist, PlaylistItem } from '../types/playlist';

export const PlaylistService = {
    async getPlaylists(childId: string) {
        const response = await api.get<{ success: boolean, data: Playlist[] }>(`/playlists/${childId}`);
        return response.data.data;
    },

    async getPlaylistById(playlistId: string) {
        const response = await api.get<{ success: boolean, data: Playlist }>(`/playlists/detail/${playlistId}`);
        return response.data.data;
    },

    async createPlaylist(data: { childId: string, name: string, description?: string }) {
        const response = await api.post<{ success: boolean, data: Playlist }>('/playlists', data);
        return response.data.data;
    },

    async deletePlaylist(playlistId: string) {
        const response = await api.delete(`/playlists/${playlistId}`);
        return response.data;
    },

    async addToPlaylist(playlistId: string, videoId: string, metadata: any) {
        const response = await api.post<{ success: boolean, data: PlaylistItem }>(`/playlists/${playlistId}/videos`, {
            videoId,
            ...metadata
        });
        return response.data.data;
    },

    async removeFromPlaylist(playlistId: string, videoId: string) {
        const response = await api.delete(`/playlists/${playlistId}/videos/${videoId}`);
        return response.data;
    },

    async toggleFavorite(childId: string, videoId: string, metadata: any) {
        const response = await api.post<{ success: boolean, isFavorited: boolean }>('/playlists/favorite/toggle', {
            childId,
            videoId,
            ...metadata
        });
        return response.data.isFavorited;
    },

    async checkFavorite(childId: string, videoId: string) {
        const response = await api.get<{ success: boolean, isFavorited: boolean }>(`/playlists/favorite/check?childId=${childId}&videoId=${videoId}`);
        return response.data.isFavorited;
    },

    async reorderItems(playlistId: string, orderedIds: string[]) {
        const response = await api.put(`/playlists/${playlistId}/reorder`, { orderedIds });
        return response.data;
    }
};

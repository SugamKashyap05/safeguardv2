import { supabaseAdmin } from '../config/supabase';

export interface Playlist {
    id: string;
    child_id: string;
    name: string;
    description?: string;
    type: 'favorites' | 'watch_later' | 'custom';
    is_default: boolean;
    thumbnail?: string;
    items?: PlaylistItem[];
    item_count?: number;
    created_at: string;
    updated_at: string;
}

export interface PlaylistItem {
    id: string;
    playlist_id: string;
    video_id: string;
    position: number;
    added_at: string;
    video_metadata: {
        title: string;
        thumbnail: string;
        channelTitle: string;
        duration?: string;
        viewCount?: string;
        publishedAt?: string;
    };
}

export class PlaylistService {

    /**
     * Create default playlists for a new child
     */
    static async createDefaultPlaylists(childId: string) {
        const defaults = [
            {
                child_id: childId,
                name: 'Favorites',
                type: 'favorites',
                is_default: true,
                description: 'Your favorite videos'
            },
            {
                child_id: childId,
                name: 'Watch Later',
                type: 'watch_later',
                is_default: true,
                description: 'Videos saved for later'
            }
        ];

        const { error } = await supabaseAdmin
            .from('playlists')
            .insert(defaults);

        if (error) throw error;
    }

    /**
     * Get all playlists for a child
     */
    static async getPlaylists(childId: string) {
        // Get playlists
        const { data: playlists, error } = await supabaseAdmin
            .from('playlists')
            .select('*')
            .eq('child_id', childId)
            .order('is_default', { ascending: false }) // Defaults first
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Get item counts and thumbnails for each playlist
        // This is a bit n+1 but Supabase doesn't do deep aggregation easily without simplified views
        // Optimization: Create a database view or function for this

        const playlistsWithMeta = await Promise.all(playlists.map(async (pl) => {
            const { count } = await supabaseAdmin
                .from('playlist_items')
                .select('*', { count: 'exact', head: true })
                .eq('playlist_id', pl.id);

            // Get first video thumbnail if playlist thumbnail is missing
            if (!pl.thumbnail && count && count > 0) {
                const { data: firstItem } = await supabaseAdmin
                    .from('playlist_items')
                    .select('video_metadata')
                    .eq('playlist_id', pl.id)
                    .order('position', { ascending: true })
                    .limit(1)
                    .single();

                if (firstItem?.video_metadata?.thumbnail) {
                    pl.thumbnail = firstItem.video_metadata.thumbnail;
                }
            }

            return {
                ...pl,
                item_count: count || 0
            };
        }));

        return playlistsWithMeta;
    }

    /**
     * Get specific playlist with videos
     */
    static async getPlaylistById(playlistId: string) {
        const { data: playlist, error } = await supabaseAdmin
            .from('playlists')
            .select('*')
            .eq('id', playlistId)
            .single();

        if (error) throw error;

        const { data: items, error: itemsError } = await supabaseAdmin
            .from('playlist_items')
            .select('*')
            .eq('playlist_id', playlistId)
            .order('position', { ascending: true });

        if (itemsError) throw itemsError;

        return {
            ...playlist,
            items: items || []
        };
    }

    /**
     * Create custom playlist
     */
    static async createPlaylist(childId: string, name: string, description?: string) {
        // Limit: Max 10 custom playlists per child
        const { count: customCount } = await supabaseAdmin
            .from('playlists')
            .select('*', { count: 'exact', head: true })
            .eq('child_id', childId)
            .eq('is_default', false);

        if (customCount && customCount >= 10) {
            throw new Error('Maximum of 10 custom playlists allowed');
        }

        const { data, error } = await supabaseAdmin
            .from('playlists')
            .insert({
                child_id: childId,
                name,
                description,
                type: 'custom',
                is_default: false
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Add video to playlist
     */
    static async addToPlaylist(playlistId: string, videoId: string, metadata: any) {
        // Limit: Max 50 videos per playlist
        const { count: videoCount } = await supabaseAdmin
            .from('playlist_items')
            .select('*', { count: 'exact', head: true })
            .eq('playlist_id', playlistId);

        if (videoCount && videoCount >= 50) {
            throw new Error('Maximum of 50 videos per playlist allowed');
        }

        // Check if exists
        const { count } = await supabaseAdmin
            .from('playlist_items')
            .select('*', { count: 'exact', head: true })
            .eq('playlist_id', playlistId)
            .eq('video_id', videoId);

        if (count && count > 0) {
            throw new Error('Video already in playlist');
        }

        // Get current max position
        const { data: lastItem } = await supabaseAdmin
            .from('playlist_items')
            .select('position')
            .eq('playlist_id', playlistId)
            .order('position', { ascending: false })
            .limit(1)
            .single();

        const position = lastItem ? lastItem.position + 1 : 0;

        const { data, error } = await supabaseAdmin
            .from('playlist_items')
            .insert({
                playlist_id: playlistId,
                video_id: videoId,
                position,
                video_metadata: metadata
            })
            .select()
            .single();

        if (error) throw error;

        // Update playlist updated_at
        await supabaseAdmin
            .from('playlists')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', playlistId);

        return data;
    }

    /**
     * Remove video from playlist
     */
    static async removeFromPlaylist(playlistId: string, videoId: string) {
        const { error } = await supabaseAdmin
            .from('playlist_items')
            .delete()
            .eq('playlist_id', playlistId)
            .eq('video_id', videoId);

        if (error) throw error;
    }

    /**
     * Delete playlist
     */
    static async deletePlaylist(playlistId: string) {
        // Verify it's not a default playlist
        const { data: pl } = await supabaseAdmin.from('playlists').select('is_default').eq('id', playlistId).single();
        if (pl?.is_default) throw new Error('Cannot delete default playlists');

        const { error } = await supabaseAdmin
            .from('playlists')
            .delete()
            .eq('id', playlistId);

        if (error) throw error;
    }

    /**
     * Check if video is in favorites
     */
    static async isFavorited(childId: string, videoId: string): Promise<boolean> {
        // Find favorites playlist for child
        const { data: favList } = await supabaseAdmin
            .from('playlists')
            .select('id')
            .eq('child_id', childId)
            .eq('type', 'favorites')
            .single();

        if (!favList) return false;

        const { count } = await supabaseAdmin
            .from('playlist_items')
            .select('*', { count: 'exact', head: true })
            .eq('playlist_id', favList.id)
            .eq('video_id', videoId);

        return (count || 0) > 0;
    }

    /**
     * Toggle Favorite
     */
    static async toggleFavorite(childId: string, videoId: string, metadata: any) {
        // Find favorites playlist
        let { data: favList } = await supabaseAdmin
            .from('playlists')
            .select('id')
            .eq('child_id', childId)
            .eq('type', 'favorites')
            .single();

        // Create if doesn't exist (recovery)
        if (!favList) {
            await this.createDefaultPlaylists(childId);
            const { data: newFav } = await supabaseAdmin
                .from('playlists')
                .select('id')
                .eq('child_id', childId)
                .eq('type', 'favorites')
                .single();
            favList = newFav;
        }

        if (!favList) throw new Error("Could not find or create Favorites playlist");

        const isFav = await this.isFavorited(childId, videoId);

        if (isFav) {
            await this.removeFromPlaylist(favList.id, videoId);
            return false; // Removed
        } else {
            await this.addToPlaylist(favList.id, videoId, metadata);
            return true; // Added
        }
    }

    /**
     * Reorder playlist items
     * @param playlistId - Playlist ID
     * @param orderedIds - Array of item IDs in the new order
     */
    static async reorderItems(playlistId: string, orderedIds: string[]) {
        // Update positions based on array index
        const updates = orderedIds.map((id, index) => ({
            id,
            position: index
        }));

        // Use a transaction-like approach (Supabase doesn't have true transactions for multiple updates)
        for (const update of updates) {
            const { error } = await supabaseAdmin
                .from('playlist_items')
                .update({ position: update.position })
                .eq('id', update.id)
                .eq('playlist_id', playlistId);

            if (error) throw error;
        }

        // Update playlist timestamp
        await supabaseAdmin
            .from('playlists')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', playlistId);
    }

    /**
     * Remove all videos from a child's playlists by channel
     * Called when a channel is blocked
     * @param childId - Child ID
     * @param channelId - Channel ID to remove
     */
    static async removeVideosByChannel(childId: string, channelId: string) {
        // Get all playlists for this child
        const { data: playlists } = await supabaseAdmin
            .from('playlists')
            .select('id')
            .eq('child_id', childId);

        if (!playlists || playlists.length === 0) return;

        // For each playlist, find items with matching channel and delete them
        for (const playlist of playlists) {
            // Get items with video_metadata containing the channelId
            // Since channelId is stored in video_metadata JSONB, we use a contains query
            const { data: items } = await supabaseAdmin
                .from('playlist_items')
                .select('id, video_metadata')
                .eq('playlist_id', playlist.id);

            if (!items) continue;

            // Filter items by channelId in metadata
            const toDelete = items.filter(item =>
                item.video_metadata?.channelId === channelId ||
                item.video_metadata?.channelTitle?.toLowerCase().includes(channelId.toLowerCase())
            );

            if (toDelete.length > 0) {
                // Delete matching items
                await supabaseAdmin
                    .from('playlist_items')
                    .delete()
                    .in('id', toDelete.map(i => i.id));
            }
        }
    }
    /**
     * Get Curated Discovery Playlists
     */
    static async getDiscoveryPlaylists() {
        return {
            education: [
                {
                    id: 'PL8dPuuaLjXtN0ge77e6y8l5G2lzXwYI_p',
                    title: 'Crash Course Kids',
                    description: 'Science for kids',
                    thumbnail: 'https://i.ytimg.com/vi/k0XH6l4a3I8/hqdefault.jpg',
                    item_count: 50
                },
                {
                    id: 'PL139F241EBC37D97F',
                    title: 'Story Time',
                    description: 'Read aloud books for children',
                    thumbnail: 'https://i.ytimg.com/vi/1_I-wK5vB3E/hqdefault.jpg',
                    item_count: 25
                },
            ],
            music: [
                {
                    id: 'PLdkj6XH8GYPRl_mM2rN7K9eM8s0G5D-xX',
                    title: 'Disney Sing-Alongs',
                    description: 'Favorite Disney songs',
                    thumbnail: 'https://i.ytimg.com/vi/L0MK7qz13bU/hqdefault.jpg',
                    item_count: 40
                },
            ],
            science: [
                {
                    id: 'PLQlnTldJs0ZQq-C-lsnACLUn_7M8QfJ_x',
                    title: 'Nat Geo Kids',
                    description: 'Animals and nature',
                    thumbnail: 'https://i.ytimg.com/vi/DefLknjRjV0/hqdefault.jpg',
                    item_count: 30
                }
            ]
        };
    }
}

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

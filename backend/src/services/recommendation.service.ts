import { supabaseAdmin } from '../config/supabase';
import { YouTubeService } from './youtube.service';
import { AppError } from '../utils/AppError';
import { HTTP_STATUS } from '../utils/httpStatus';

const youtubeService = new YouTubeService();

export class RecommendationService {

    /**
     * Get Personalized Recommendations
     * Based on last 10 watched videos to find top tags/categories
     */
    async getPersonalized(childId: string): Promise<any> {
        // 1. Fetch recent history
        const { data: history } = await supabaseAdmin
            .from('watch_history')
            .select('video_title, channel_id, channel_name, category')
            .eq('child_id', childId)
            .order('watched_at', { ascending: false })
            .limit(10);

        let query = 'kids cartoons'; // Default

        if (history && history.length > 0) {
            // Simple heuristic directly based on last watched titles
            const lastVideo = history[0];
            query = `${lastVideo.video_title} related`;
        }

        // 2. Fetch from YouTube with fallback
        let videos: any[] = [];
        try {
            videos = await youtubeService.searchVideos(query, 'all') as any[];
        } catch (err) {
            console.error('Rec Service - Search Failed:', err);
            // Verify if we have cached children or just return empty to avoid crash
            videos = [];
        }

        // 3. Simple Transformation
        return {
            type: 'personalized',
            items: videos.map((v: any) => ({
                videoId: v.videoId, // Fixed: accessing direct property
                title: v.title,     // Fixed: accessing direct property
                thumbnail: v.thumbnail, // Fixed: accessing direct property (already formatted by YouTubeService)
                channelTitle: v.channelTitle,
                reason: history && history.length > 0 ? 'Because you watched similar videos' : 'Popular now'
            }))
        };
    }

    /**
     * Get Educational Content
     * Static queries for now, can be improved
     */
    async getEducational(childId: string, ageLevel?: string) {
        // ageLevel could optimize the query terms
        const query = 'educational videos for kids science nature';
        let videos: any[] = [];
        try {
            videos = await youtubeService.searchVideos(query, ageLevel || 'all') as any[];
        } catch (e) { console.error(e); videos = []; }

        return {
            type: 'educational',
            items: videos.map((v: any) => ({
                videoId: v.videoId,
                title: v.title,
                thumbnail: v.thumbnail,
                channelTitle: v.channelTitle,
                reason: 'Learn something new!'
            }))
        };
    }

    /**
     * Get Trending / For You
     */
    async getTrending(childId: string) {
        // Mocking "Trending" with a robust safe query
        const query = 'best kids shows 2025';
        let videos: any[] = [];
        try {
            videos = await youtubeService.searchVideos(query, 'all') as any[];
        } catch (e) { console.error(e); videos = []; }

        return {
            type: 'trending',
            items: videos.map((v: any) => ({
                videoId: v.videoId,
                title: v.title,
                thumbnail: v.thumbnail,
                channelTitle: v.channelTitle,
                reason: 'Trending now'
            }))
        };
    }

    /**
     * Get By Category
     */
    async getByCategory(childId: string, category: string) {
        const query = `kids ${category} videos safe`;
        let videos: any[] = [];
        try {
            videos = await youtubeService.searchVideos(query, 'all') as any[];
        } catch (e) { console.error(e); videos = []; }
        return {
            type: 'category',
            category,
            items: videos.map((v: any) => ({
                videoId: v.videoId,
                title: v.title,
                thumbnail: v.thumbnail,
                channelTitle: v.channelTitle,
                reason: `Top in ${category}`
            }))
        };
    }
}

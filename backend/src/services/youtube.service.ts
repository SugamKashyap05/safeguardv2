import { google, youtube_v3 } from 'googleapis';
import NodeCache from 'node-cache';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { HTTP_STATUS } from '../utils/httpStatus';

// Cache TTL: 1 hour for searches, 24 hours for video details
const cache = new NodeCache({ stdTTL: 3600 });

export class YouTubeService {
    private youtube: youtube_v3.Youtube;
    private dailyQuotaUsed = 0;
    private quotaLimit = parseInt(process.env.YOUTUBE_API_QUOTA_LIMIT || '10000');

    constructor() {
        if (!process.env.YOUTUBE_API_KEY) {
            console.warn('YOUTUBE_API_KEY not found');
        }
        this.youtube = google.youtube({
            version: 'v3',
            auth: process.env.YOUTUBE_API_KEY
        });
    }

    /**
     * Check Quota before making request
     */
    private checkQuota(cost: number) {
        if (this.dailyQuotaUsed + cost > this.quotaLimit) {
            throw new AppError('YouTube API Quota Exceeded', HTTP_STATUS.SERVICE_UNAVAILABLE);
        }
    }

    private incrementQuota(cost: number) {
        this.dailyQuotaUsed += cost;
        // In a real app, sync this with Redis or DB
    }

    /**
     * Search Videos
     * Cost: 100 units
     */
    async searchVideos(query: string, ageLevel: string, maxResults: number = 20) {
        const cacheKey = `search:${query}:${ageLevel}:${maxResults}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached;

        this.checkQuota(100);

        // 1. Refine Query for Safety
        let refinedQuery = `${query} -shorts -#shorts`; // Exclude Shorts

        // 2. Enforce Age Context
        if (ageLevel === 'preschool' || ageLevel === 'early-elementary') {
            refinedQuery += ' for kids';
        }

        try {
            const response = await this.youtube.search.list({
                part: ['snippet'],
                q: refinedQuery,
                type: ['video'],
                maxResults: maxResults,
                safeSearch: 'strict',
                videoEmbeddable: 'true',
                relevanceLanguage: 'en',
                regionCode: 'US',
                // videoDuration: 'medium', // Optional: Enforce > 4 mins to avoid shorts? Too strict maybe.
            });

            this.incrementQuota(100);

            const results = response.data.items?.map(item => ({
                videoId: item.id?.videoId,
                title: item.snippet?.title,
                thumbnail: item.snippet?.thumbnails?.high?.url,
                channelTitle: item.snippet?.channelTitle,
                publishedAt: item.snippet?.publishedAt
            })) || [];

            cache.set(cacheKey, results);
            return results;

        } catch (error: any) {
            console.error('YouTube Search Error:', error);
            throw new AppError('Failed to search YouTube', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get Video Details
     * Cost: 1 unit per ID (approx)
     */
    async getVideoDetails(videoId: string) {
        const cacheKey = `video:${videoId}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached;

        this.checkQuota(1);

        try {
            const response = await this.youtube.videos.list({
                part: ['snippet', 'contentDetails', 'statistics', 'status'],
                id: [videoId]
            });

            this.incrementQuota(1);
            const video = response.data.items?.[0];

            if (!video) throw new AppError('Video not found', HTTP_STATUS.NOT_FOUND);

            const details = {
                id: video.id,
                title: video.snippet?.title,
                description: video.snippet?.description,
                channelId: video.snippet?.channelId,
                thumbnails: video.snippet?.thumbnails,
                tags: video.snippet?.tags || [],
                categoryId: video.snippet?.categoryId,
                duration: video.contentDetails?.duration,
                viewCount: video.statistics?.viewCount,
                contentRating: video.contentDetails?.contentRating,
                embeddable: video.status?.embeddable
            };

            cache.set(cacheKey, details, 86400); // 24 hours
            return details;
        } catch (error: any) {
            throw new AppError('Failed to get video details', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Check Video Safety Score (Simple Logic)
     */
    async checkVideoSafety(videoId: string): Promise<{ safe: boolean; score: number; reasons: string[] }> {
        const details: any = await this.getVideoDetails(videoId);
        const reasons: string[] = [];
        let score = 100;

        // 1. Check Keywords (Naive)
        const unsafeKeywords = ['violence', 'fight', 'scary', 'death', 'blood', 'weapon'];
        const textToCheck = (details.title + ' ' + details.description + ' ' + details.tags.join(' ')).toLowerCase();

        unsafeKeywords.forEach(word => {
            if (textToCheck.includes(word)) {
                score -= 20;
                reasons.push(`Contains keyword: ${word}`);
            }
        });

        // 2. Check Embeddable
        if (!details.embeddable) {
            score -= 50;
            reasons.push('Not embeddable (likely restricted)');
        }

        // 3. YouTube Kids Category Check (Naive - check if category is Education (27) or Film (1) etc)
        // This is weak, real safety requires transcription or more data.

        return {
            safe: score > 70,
            score,
            reasons
        };
    }
}

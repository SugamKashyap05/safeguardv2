import { supabaseAdmin } from '../config/supabase';
// @ts-ignore
import { YouTubeService } from './youtube.service';
// @ts-ignore
import { ContentFilterService } from './content-filter.service';
import { AppError } from '../utils/AppError';
import { HTTP_STATUS } from '../utils/httpStatus';

const youtubeService = new YouTubeService();
const filterService = new ContentFilterService();

export class SafeSearchService {

    /**
     * Sanitize the query string
     */
    async sanitizeQuery(query: string, childId: string): Promise<string> {
        // 1. Basic cleaning
        let cleanQuery = query.trim();

        // 2. Check for blocked words (using ContentFilter logic)
        // We can reuse the isAllowed logic or duplicate small check for query specific
        const { allowed, reason } = await filterService.checkText(cleanQuery, childId);

        if (!allowed) {
            // Log the blocked attempt?
            // For now, throw error so frontend shows "Try something else"
            throw new AppError(`Search term blocked: ${reason}`, HTTP_STATUS.BAD_REQUEST);
        }

        return cleanQuery;
    }

    /**
     * Search Videos with Safety
     */
    async searchVideos(query: string, childId: string) {
        // 1. Sanitize
        const cleanQuery = await this.sanitizeQuery(query, childId);

        // 2. Get Child Age for Context (Optional, for now generic safe search)
        // const { data: child } = await supabaseAdmin.from('children').select('age_level').eq('id', childId).single();

        // 3. Search YouTube
        // YouTubeService already has safeSearch: 'strict'
        const results = await youtubeService.searchVideos(cleanQuery, 'all'); // 'all' age level for now

        // 4. Double Check Results (Post-Filter)
        // Check titles/descriptions against blocklist again because YouTube might let some through
        const filteredResults = [];
        for (const video of results) {
            const checkText = `${video.title} ${video.channelTitle}`;
            const { allowed } = await filterService.checkText(checkText, childId);
            if (allowed) {
                filteredResults.push(video);
            }
        }

        // 5. Log Search
        try {
            await supabaseAdmin.from('search_history').insert({
                child_id: childId,
                query: cleanQuery,
                results_count: filteredResults.length
            });
        } catch (err) {
            console.error('Failed to log search', err);
        }

        return filteredResults;
    }

    /**
     * Get Search History
     */
    async getHistory(childId: string, limit = 20) {
        const { data, error } = await supabaseAdmin
            .from('search_history')
            .select('*')
            .eq('child_id', childId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data;
    }

    /**
     * Get Suggestions
     */
    async getSuggestions(childId: string): Promise<string[]> {
        // Mock suggestions for MVP
        return [
            "Lego building",
            "Space rockets",
            "Funny cats",
            "Learn to draw",
            "Science experiments",
            "Minecraft building"
        ];
    }
}

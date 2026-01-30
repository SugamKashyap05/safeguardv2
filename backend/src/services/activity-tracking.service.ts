import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';
import { HTTP_STATUS } from '../utils/httpStatus';
import { questService } from './quest.service';

interface WatchLogData {
    childId: string;
    videoId: string;
    videoTitle: string;
    channelId: string;
    channelName: string;
    thumbnail?: string;
    duration?: number;
    category?: string;
}

export class ActivityTrackingService {

    /**
     * Log Video Start
     */
    async logVideoStart(data: WatchLogData) {
        // Check if there is already an active incomplete session for this video? 
        // For simplicity, always create new/or upsert if very recent.
        // We'll create a new entry for every "session".

        const { data: log, error } = await supabaseAdmin
            .from('watch_history')
            .insert({
                child_id: data.childId,
                video_id: data.videoId,
                video_title: data.videoTitle,
                channel_id: data.channelId,
                channel_name: data.channelName,
                thumbnail: data.thumbnail,
                duration: data.duration,
                category: data.category,
                watched_duration: 0,
                watch_percentage: 0,
                completed_watch: false,
                watched_at: new Date()
            })
            .select()
            .single();

        if (error) throw error;
        return log;
    }

    /**
     * Update Watch Progress
     */
    async updateProgress(historyId: string, watchedDuration: number, duration: number) {
        const percentage = duration > 0 ? Math.round((watchedDuration / duration) * 100) : 0;

        const { data: updateResult, error } = await supabaseAdmin
            .from('watch_history')
            .update({
                watched_duration: watchedDuration,
                watch_percentage: percentage,
                // If > 90%, mark complete? Or explicit call?
                completed_watch: percentage >= 90
            })
            .eq('id', historyId)
            .select('child_id') // Needed to know child
            .single();

        if (error) throw error;

        // --- Gamification Hook ---
        // For simplicity, we just add the *increment*? 
        // No, updateProgress takes total.
        // QuestService updateProgress adds delta.
        // We typically receive absolute watchedDuration. 
        // We need to know delta to add to quest. 
        // OR we can just add 1 minute every minute.
        // The frontend sends periodic updates.
        // Let's assume frontend sends updates every X seconds.
        // Ideally we compare with previous value.
        // BUT, a simpler approach for MVP:
        // Calculate delta from previous DB state? Fetching it is expensive?
        // Let's rely on frontend sending heartbeats and assume roughly 30s-60s chunks?
        // Actually, safer:
        // questService.updateProgress('watch_time', delta)
        // We don't have delta easily here without read.
        // Let's do a quick read of previous duration if feasible.
        // OR: Since we just updated, maybe we just assume if progress > prev...

        // ALTERNATIVE: Just hook 'videos_watched' on completion for now to be safe.
        // 'watch_time' is harder without delta. 
        // Let's implement 'videos_watched' first in markComplete.

        // If we really want watch time, we need to know how much was added.
        // Let's try to get child_id from the update result.
        // @ts-ignore
        if (updateResult && updateResult.child_id) {
            // We can't easily do exact minutes without diff.
            // Let's leave watch_time for next iteration and focus on videos_watched.
        }

        return { success: true, percentage };

        if (error) throw error;
        return { success: true, percentage };
    }

    /**
     * Mark Complete
     */
    async markComplete(historyId: string) {
        const { data: updateResult, error } = await supabaseAdmin
            .from('watch_history')
            .update({
                completed_watch: true,
                watch_percentage: 100
            })
            .eq('id', historyId)
            .select('child_id')
            .single();

        if (error) throw error;

        // Gamification Hook
        if (updateResult) {
            await questService.updateProgress(updateResult.child_id, 'videos_watched', 1);
        }

        return true;
    }

    /**
     * Log Blocked Attempt
     */
    async logBlockedAttempt(childId: string, videoId: string | null, reason: string, meta: any = {}) {
        // Check if already logged recently to avoid spam?
        const { error } = await supabaseAdmin
            .from('watch_history') // We can log blocked attempts in watch_history OR blocked_content table?
            // User schema for watch_history has 'wasBlocked' field.
            // Also user schema has 'blocked_content' table which seemed to be a rule list, but activity_logs is for logs.
            // Let's use watch_history with was_blocked=true for blocked *attempts* if it relates to a video.
            .insert({
                child_id: childId,
                video_id: videoId || 'unknown',
                video_title: meta.title || 'Unknown Video',
                channel_id: meta.channelId || 'unknown',
                channel_name: meta.channelName || 'Unknown',
                was_blocked: true,
                block_reason: reason,
                watched_at: new Date()
            });

        if (error) {
            // Fallback or ignore
            console.error('Failed to log block', error);
        }

        // Also add to Activity Log for notifications
        await supabaseAdmin.from('activity_logs').insert({
            child_id: childId,
            type: 'video_blocked',
            data: { videoId, reason, ...meta }
        });
    }

    /**
     * Get Stats
     */
    async getStats(childId: string, days: number = 7) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data: history } = await supabaseAdmin
            .from('watch_history')
            .select('*')
            .eq('child_id', childId)
            .gte('watched_at', startDate.toISOString())
            .eq('was_blocked', false); // Only actual watches

        if (!history || history.length === 0) return { totalMinutes: 0, videosWatched: 0, topCategories: [] };

        const totalSeconds = history.reduce((sum, item) => sum + (item.watched_duration || 0), 0);
        const totalMinutes = Math.round(totalSeconds / 60);

        // Categories
        const catMap: Record<string, number> = {};
        history.forEach(h => {
            if (h.category) catMap[h.category] = (catMap[h.category] || 0) + 1;
        });

        const topCategories = Object.entries(catMap)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({ name, count }))
            .slice(0, 5);

        return {
            totalMinutes,
            videosWatched: history.length,
            topCategories
        };
    }

    /**
     * Get History List
     */
    async getHistory(childId: string, page: number = 1, limit: number = 20) {
        const start = (page - 1) * limit;
        const end = start + limit - 1;

        const { data, count } = await supabaseAdmin
            .from('watch_history')
            .select('*', { count: 'exact' })
            .eq('child_id', childId)
            .order('watched_at', { ascending: false })
            .range(start, end);

        return { data, total: count, page, limit };
    }
}

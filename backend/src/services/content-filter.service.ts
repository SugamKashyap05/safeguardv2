import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';
import { HTTP_STATUS } from '../utils/httpStatus';

interface VideoMetadata {
    videoId: string;
    title: string;
    description?: string;
    channelId: string;
    durationMinutes?: number;
    tags?: string[];
    categoryId?: string;
}

export class ContentFilterService {

    /**
     * Check if a video is allowed for a specific child
     */
    async isVideoAllowed(childId: string, video: VideoMetadata): Promise<{ allowed: boolean; reason?: string }> {
        // 1. Check Explicit Whitelist (Approved Videos)
        const { data: approvedVideo } = await supabaseAdmin
            .from('approved_videos')
            .select('id')
            .eq('child_id', childId)
            .eq('video_id', video.videoId)
            .single();

        if (approvedVideo) return { allowed: true, reason: 'Explicitly approved by parent' };

        // 2. Check Explicit Blacklist (Blocked Content)
        const { data: blocked } = await supabaseAdmin
            .from('blocked_content')
            .select('reason')
            .eq('child_id', childId)
            .or(`video_id.eq.${video.videoId},channel_id.eq.${video.channelId}`)
            .single();

        if (blocked) return { allowed: false, reason: blocked.reason || 'Blocked by parent' };

        // 3. Get Child Profile & Filters
        const { data: child } = await supabaseAdmin
            .from('children')
            .select('age_appropriate_level, age')
            .eq('id', childId)
            .single();

        const { data: filters } = await supabaseAdmin
            .from('content_filters')
            .select('*')
            .eq('child_id', childId)
            .single();

        if (!child) throw new AppError('Child not found', HTTP_STATUS.NOT_FOUND);

        // 4. Check Approved Channels
        const isChannelApproved = await this.isChannelApproved(video.channelId, childId);

        // If Strict Mode is ON, only allow if channel is approved OR video is approved
        if (filters?.strict_mode && !isChannelApproved) {
            return { allowed: false, reason: 'Strict mode: Channel not in approved list' };
        }

        // 5. Check Duration Limits (if available)
        if (video.durationMinutes && filters?.max_video_duration_minutes) {
            if (video.durationMinutes > filters.max_video_duration_minutes) {
                return { allowed: false, reason: `Video is too long (> ${filters.max_video_duration_minutes}m)` };
            }
        }

        // 6. Check Blocked Keywords
        if (filters?.blocked_keywords?.length > 0) {
            const text = `${video.title} ${video.description || ''} ${video.tags?.join(' ') || ''}`;
            if (await this.containsBlockedKeywords(text, filters.blocked_keywords)) {
                return { allowed: false, reason: 'Contains blocked keywords' };
            }
        }

        // 7. Age Appropriate Rules (if not strict mode or as additional check)
        const ageCheck = await this.checkAgeAppropriateness(child.age_appropriate_level, video);
        if (!ageCheck.allowed) return ageCheck;

        return { allowed: true };
    }

    /**
     * Check if channel is approved
     */
    async isChannelApproved(channelId: string, childId: string): Promise<boolean> {
        const { data } = await supabaseAdmin
            .from('approved_channels')
            .select('id')
            .eq('child_id', childId)
            .eq('channel_id', channelId)
            .single();
        return !!data;
    }

    async checkText(text: string, childId: string): Promise<{ allowed: boolean; reason?: string }> {
        const { data: filters } = await supabaseAdmin
            .from('content_filters')
            .select('blocked_keywords')
            .eq('child_id', childId)
            .single();

        if (filters && filters.blocked_keywords && filters.blocked_keywords.length > 0) {
            if (await this.containsBlockedKeywords(text, filters.blocked_keywords)) {
                return { allowed: false, reason: 'Contains blocked keywords' };
            }
        }
        return { allowed: true };
    }

    /**
     * Keyword Blocking Logic
     */
    async containsBlockedKeywords(text: string, keywords: string[]): Promise<boolean> {
        const lowerText = text.toLowerCase();
        return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
    }

    /**
     * Helper: Age Logic
     */
    private async checkAgeAppropriateness(level: string, video: VideoMetadata): Promise<{ allowed: boolean; reason?: string }> {
        // Basic heuristics based on category or naive duration if not strictly filtered
        // In real app, this would use YouTube Content Rating or heavy AI classification.

        // Preschool Rules
        if (level === 'preschool') {
            if (video.durationMinutes && video.durationMinutes > 10) {
                return { allowed: false, reason: 'Preschool: Max 10 mins' };
            }
            // Block generic "Entertainment" (24) if not Education (27) or Music (10)? Very naive.
            // Using placeholder logic:
            if (video.categoryId && !['27', '10', '1', '29'].includes(video.categoryId)) {
                // 1=Film, 10=Music, 27=Edu, 29=Nonprofits
                // return { allowed: false, reason: 'Preschool: Category not educational' };
            }
        }

        // Early Elementary
        if (level === 'early-elementary') {
            if (video.durationMinutes && video.durationMinutes > 15) {
                return { allowed: false, reason: 'Early Elementary: Max 15 mins' };
            }
        }

        return { allowed: true };
    }

    /**
     * Manage Filters
     */
    async getFilters(childId: string) {
        let { data } = await supabaseAdmin.from('content_filters').select('*').eq('child_id', childId).single();
        if (!data) {
            // Create default if missing
            const { data: newFilters, error } = await supabaseAdmin.from('content_filters').insert({ child_id: childId }).select().single();
            if (error) throw error;
            return newFilters;
        }
        return data;
    }

    async updateFilters(childId: string, updates: any) {
        const { error } = await supabaseAdmin
            .from('content_filters')
            .upsert({ ...updates, child_id: childId, updated_at: new Date() })
            .eq('child_id', childId);
        if (error) throw error;
        return true;
    }

    /**
     * Block/Approve Actions
     */
    async blockVideo(childId: string, videoId: string, reason?: string) {
        return supabaseAdmin.from('blocked_content').insert({
            child_id: childId,
            video_id: videoId,
            reason
        });
    }

    async approveChannel(childId: string, channelId: string, channelName: string, approverId: string) {
        return supabaseAdmin.from('approved_channels').upsert({
            child_id: childId,
            channel_id: channelId,
            channel_name: channelName,
            approved_by: approverId
        }, { onConflict: 'child_id,channel_id' });
    }
}

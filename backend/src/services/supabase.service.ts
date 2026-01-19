import { supabaseAdmin } from '../config/supabase';

export class SupabaseService {
    /**
     * Fetch the profile of a parent by their User ID
     */
    async getParentProfile(userId: string) {
        const { data, error } = await supabaseAdmin
            .from('parents')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Fetch all active children associated with a parent
     */
    async getChildren(parentId: string) {
        const { data, error } = await supabaseAdmin
            .from('children')
            .select('*')
            .eq('parent_id', parentId)
            .eq('is_active', true);

        if (error) throw error;
        return data;
    }

    /**
     * Log a watch history entry
     */
    async addWatchHistory(historyData: {
        child_id: string;
        video_id: string;
        video_title: string;
        channel_id: string;
        channel_name: string;
        thumbnail?: string;
        duration?: number;
    }) {
        const { data, error } = await supabaseAdmin
            .from('watch_history')
            .insert(historyData)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}

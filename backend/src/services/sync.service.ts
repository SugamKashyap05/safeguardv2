
import { supabase } from '../config/supabase';

export class SyncService {

    // Sync Progress
    async syncWatchProgress(childId: string, videoId: string, position: number, deviceId: string) {
        const { error } = await supabase
            .from('session_sync')
            .upsert({
                child_id: childId,
                video_id: videoId,
                position: position,
                device_id: deviceId, // The device reporting the status
                start_at: new Date(),
                last_synced_at: new Date()
            }, { onConflict: 'child_id' });

        if (error) throw error;
    }

    // Get Active Session
    async getActiveSession(childId: string) {
        const { data, error } = await supabase
            .from('session_sync')
            .select('*')
            .eq('child_id', childId)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // Ignore no rows found
        return data;
    }
}

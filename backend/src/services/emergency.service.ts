import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';
import { HTTP_STATUS } from '../utils/httpStatus';

export class EmergencyService {

    /**
     * Pause Child Access
     */
    async pauseChild(childId: string, reason: string, durationMinutes?: number | null) {
        const updateData: any = {
            is_active: false,
            pause_reason: reason,
            // If duration is provided, calculate paused_until
            // If null/undefined, it matches "Indefinite" (paused_until = null but is_active = false)
            paused_until: durationMinutes ? new Date(Date.now() + durationMinutes * 60000).toISOString() : null
        };

        const { error } = await supabaseAdmin
            .from('children')
            .update(updateData)
            .eq('id', childId);

        if (error) throw new AppError('Failed to pause child', HTTP_STATUS.INTERNAL_SERVER_ERROR);

        // Terminate sessions
        await this.terminateSessions(childId);

        // Log Activity
        await this.logActivity(childId, 'emergency_pause', { reason, duration: durationMinutes });

        return { success: true, message: 'Child paused' };
    }

    /**
     * Resume Child Access
     */
    async resumeChild(childId: string) {
        const { error } = await supabaseAdmin
            .from('children')
            .update({
                is_active: true,
                pause_reason: null,
                paused_until: null
            })
            .eq('id', childId);

        if (error) throw new AppError('Failed to resume child', HTTP_STATUS.INTERNAL_SERVER_ERROR);

        await this.logActivity(childId, 'emergency_resume', {});
        return { success: true, message: 'Child resumed' };
    }

    /**
     * Panic Pause (All Children for a Parent)
     */
    async panicPauseAll(parentId: string, reason: string) {
        // 1. Get all children IDs
        const { data: children } = await supabaseAdmin
            .from('children')
            .select('id')
            .eq('parent_id', parentId);

        if (!children?.length) return { success: true, count: 0 };

        const childIds = children.map(c => c.id);

        // 2. Update all
        const { error } = await supabaseAdmin
            .from('children')
            .update({
                is_active: false,
                pause_reason: reason,
                paused_until: null // Indefinite
            })
            .in('id', childIds);

        if (error) throw new AppError('Panic pause failed', HTTP_STATUS.INTERNAL_SERVER_ERROR);

        // 3. Terminate all sessions
        for (const id of childIds) {
            await this.terminateSessions(id);
            await this.logActivity(id, 'emergency_panic_pause', { reason });
        }

        return { success: true, count: childIds.length };
    }

    /**
     * Panic Resume (Resume all children for a parent)
     */
    async panicResumeAll(parentId: string) {
        // 1. Get all children IDs
        const { data: children } = await supabaseAdmin
            .from('children')
            .select('id')
            .eq('parent_id', parentId);

        if (!children?.length) return { success: true, count: 0 };

        const childIds = children.map(c => c.id);

        // 2. Update all to active
        const { error } = await supabaseAdmin
            .from('children')
            .update({
                is_active: true,
                pause_reason: null,
                paused_until: null
            })
            .in('id', childIds);

        if (error) throw new AppError('Panic resume failed', HTTP_STATUS.INTERNAL_SERVER_ERROR);

        // 3. Log Activity
        for (const id of childIds) {
            await this.logActivity(id, 'emergency_panic_resume', {});
        }

        return { success: true, count: childIds.length };
    }

    /**
     * Emergency Block Content
     */
    async emergencyBlock(childId: string, type: 'video' | 'channel', id: string) {
        const payload: any = {
            child_id: childId,
            reason: 'emergency_block',
            is_emergency: true,
            blocked_at: new Date().toISOString()
        };

        if (type === 'video') payload.video_id = id;
        else payload.channel_id = id;

        const { error } = await supabaseAdmin
            .from('blocked_content')
            .insert(payload);

        if (error) throw new AppError('Block failed', HTTP_STATUS.INTERNAL_SERVER_ERROR);

        // Terminate sessions if watching this content?
        // For MVP, simplistic session termination or relying on heartbeat check
        return { success: true };
    }

    private async terminateSessions(childId: string) {
        await supabaseAdmin
            .from('child_sessions')
            .update({ is_active: false })
            .eq('child_id', childId)
            .eq('is_active', true);
    }

    private async logActivity(childId: string, type: string, data: any) {
        // Fetch parentId for the log (a bit inefficient but cleaner)
        const { data: child } = await supabaseAdmin.from('children').select('parent_id').eq('id', childId).single();
        if (child) {
            await supabaseAdmin.from('activity_logs').insert({
                child_id: childId,
                parent_id: child.parent_id,
                type,
                data
            });
        }
    }
}

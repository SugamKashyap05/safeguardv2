import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';
import { HTTP_STATUS } from '../utils/httpStatus';

interface TimeWindow {
    dayOfWeek: number; // 0-6
    startTime: string; // "HH:MM"
    endTime: string;   // "HH:MM"
}

export class ScreenTimeService {

    /**
     * Get Rules & Usage
     */
    async getRules(childId: string) {
        const { data: rules } = await supabaseAdmin
            .from('screen_time_rules')
            .select('*')
            .eq('child_id', childId)
            .single();

        if (!rules) {
            // Create default
            const { data: newRules, error } = await supabaseAdmin
                .from('screen_time_rules')
                .insert({ child_id: childId })
                .select()
                .single();
            if (error) throw error;
            return newRules;
        }
        return rules;
    }

    /**
     * Update Rules
     */
    async updateRules(childId: string, updates: any) {
        // Validation logic for time windows could go here
        const { error } = await supabaseAdmin
            .from('screen_time_rules')
            .update({ ...updates, updated_at: new Date() })
            .eq('child_id', childId);

        if (error) throw error;
        return true;
    }

    /**
     * Check Time Remaining (Minutes)
     */
    async checkTimeRemaining(childId: string): Promise<number> {
        const rules = await this.getRules(childId);

        // 1. Check Global Pause
        const { data: child } = await supabaseAdmin
            .from('children')
            .select('is_active, paused_until')
            .eq('id', childId)
            .single();

        if (child?.paused_until && new Date(child.paused_until) > new Date()) {
            return 0; // Paused
        }

        // 2. Check Allowed Hours
        if (!this.isWithinAllowedHoursLogic(rules)) {
            return 0; // Bedtime or Outside Window
        }

        // 3. Check Daily Limit
        const day = new Date().getDay();
        const isWeekend = day === 0 || day === 6;
        let limit = rules.daily_limit_minutes;

        if (isWeekend && rules.weekend_limit_minutes) limit = rules.weekend_limit_minutes;
        else if (!isWeekend && rules.weekday_limit_minutes) limit = rules.weekday_limit_minutes;

        const remaining = Math.max(0, limit - (rules.today_usage_minutes || 0));
        return remaining;
    }

    /**
     * Increment Usage
     */
    async incrementUsage(childId: string, minutes: number) {
        // Atomic increment? Supabase doesn't have easy atomic increment via JS client without RPC.
        // We'll read-then-update for MVP or ideally use RPC.
        // Let's use a simple RPC or just read-update (risk of race condition but acceptable for MVP stats).
        // Actually, we can check if we can do `today_usage_minutes = today_usage_minutes + x`? No.

        const rules = await this.getRules(childId);
        const newUsage = (rules.today_usage_minutes || 0) + minutes;

        // Check if day changed? The schema has `last_reset_date`.
        const todayStr = new Date().toISOString().split('T')[0];
        let updateData: any = { today_usage_minutes: newUsage };

        if (rules.last_reset_date !== todayStr) {
            updateData = {
                today_usage_minutes: minutes,
                last_reset_date: todayStr
            };
        }

        await supabaseAdmin
            .from('screen_time_rules')
            .update(updateData)
            .eq('child_id', childId);
    }

    /**
     * Grant Extra Time
     */
    async grantExtraTime(childId: string, minutes: number) {
        const rules = await this.getRules(childId);
        // Reduce usage to grant more time (Hack/MVP)
        const newUsage = Math.max(0, (rules.today_usage_minutes || 0) - minutes);

        await supabaseAdmin
            .from('screen_time_rules')
            .update({ today_usage_minutes: newUsage })
            .eq('child_id', childId);

        // Also unpause if paused
        await supabaseAdmin
            .from('children')
            .update({ paused_until: null })
            .eq('id', childId);
    }

    /**
     * Pause / Resume
     */
    async setPauseStatus(childId: string, paused: boolean) {
        const updates = paused
            ? { paused_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), pause_reason: 'Parent initiated' } // Pause for 24h default
            : { paused_until: null, pause_reason: null };

        await supabaseAdmin
            .from('children')
            .update(updates)
            .eq('id', childId);
    }

    /**
     * Helper: Allowed Time Logic
     */
    private isWithinAllowedHoursLogic(rules: any): boolean {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const day = now.getDay(); // 0-6

        // 1. Bedtime Check
        if (rules.bedtime_mode?.enabled) {
            const start = this.timeToMinutes(rules.bedtime_mode.startTime);
            const end = this.timeToMinutes(rules.bedtime_mode.endTime);

            // Handle overnight (e.g. 20:00 to 07:00)
            if (start > end) {
                if (currentMinutes >= start || currentMinutes < end) return false;
            } else {
                if (currentMinutes >= start && currentMinutes < end) return false;
            }
        }

        // 2. Specific Time Windows (if defined and non-empty)
        // If allowedTimeWindows is empty, assume allowed all day (except bedtime).
        // If present, MUST be within one of them.
        const windows: TimeWindow[] = rules.allowed_time_windows || [];
        const todayWindows = windows.filter(w => w.dayOfWeek === day);

        if (todayWindows.length > 0) {
            const inWindow = todayWindows.some(w => {
                const start = this.timeToMinutes(w.startTime);
                const end = this.timeToMinutes(w.endTime);
                return currentMinutes >= start && currentMinutes < end;
            });
            if (!inWindow) return false;
        }

        return true;
    }

    private timeToMinutes(timeStr: string): number {
        if (!timeStr) return 0;
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    }
}

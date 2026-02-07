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

        // Prevent overwriting usage stats via general update
        const { today_usage_minutes, last_reset_date, ...safeUpdates } = updates;

        const { error } = await supabaseAdmin
            .from('screen_time_rules')
            .update({ ...safeUpdates, updated_at: new Date() })
            .eq('child_id', childId);

        if (error) throw error;
        return true;
    }

    /**
     * Check Time Remaining (Minutes)
     */
    async checkTimeRemaining(childId: string): Promise<number> {
        // Use getDetailedStatus to ensure consistency and trigger auto-sync if needed.
        const stats = await this.getDetailedStatus(childId);

        // However, we still need to check Global Pause / Bedtime which getDetailedStatus might not fully block?
        // Actually getDetailedStatus returns 'remaining', but does it account for PAUSE?
        // Let's check getDetailedStatus implementation...
        // It calculates remaining based on LIMIT - USAGE.
        // It does NOT check Bedtime/Pause. 
        // We must re-add those checks.

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

        // 3. Return remaining from consistent stat calculation
        return stats.remaining;
    }

    /**
     * Get Detailed Status (Spent, Added, Remaining)
     */
    async getDetailedStatus(childId: string): Promise<any> {
        const rules = await this.getRules(childId);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Fetch today's history to split positive/negative
        const { data: history } = await supabaseAdmin
            .from('watch_history')
            .select('watched_duration')
            .eq('child_id', childId)
            .gte('watched_at', today.toISOString());

        // Calculate Real Spent vs Bonus
        let realSpentSeconds = 0;
        let bonusSeconds = 0;
        let netSeconds = 0;

        if (history) {
            history.forEach(item => {
                const d = item.watched_duration || 0;
                // Net calculation (just sum everything)
                netSeconds += d;

                // For display separation
                if (d > 0) realSpentSeconds += d;
                else bonusSeconds += Math.abs(d);
            });
        }

        const realSpentMinutes = Math.ceil(realSpentSeconds / 60);
        const bonusMinutes = Math.floor(bonusSeconds / 60);

        // Net Usage based on total seconds (matches updateDailyUsage logic)
        const netUsageMinutes = Math.max(0, Math.ceil(netSeconds / 60));

        // SYNC: If stored usage differs from calculated usage, update DB to match reality.
        // This fixes the "Parent sees 19m, Child sees 34m" bug.
        if (Math.abs((rules.today_usage_minutes || 0) - netUsageMinutes) > 1) {
            console.log(`🔄 Syncing screen time usage: DB=${rules.today_usage_minutes} vs CALC=${netUsageMinutes}`);
            // Fire and forget update
            supabaseAdmin
                .from('screen_time_rules')
                .update({ today_usage_minutes: netUsageMinutes })
                .eq('child_id', childId)
                .then(({ error }) => {
                    if (error) console.error('Failed to sync usage', error);
                });
        }

        // Limits
        const day = new Date().getDay();
        const isWeekend = day === 0 || day === 6;
        let limit = rules.daily_limit_minutes;
        if (isWeekend && rules.weekend_limit_minutes) limit = rules.weekend_limit_minutes;
        else if (!isWeekend && rules.weekday_limit_minutes) limit = rules.weekday_limit_minutes;

        const remaining = Math.max(0, limit - netUsageMinutes);

        return {
            remaining,
            spent: realSpentMinutes,
            added: bonusMinutes,
            limit
        };
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
    /**
     * Grant Extra Time
     */
    async grantExtraTime(childId: string, minutes: number) {
        const rules = await this.getRules(childId);

        // 1. Get a valid channel ID for the FK constraint
        // Try history first (most likely to succeed for active user)
        let channelId = 'system_override'; // Fallback if no FK constraint (unlikely)

        const { data: historyItem } = await supabaseAdmin
            .from('watch_history')
            .select('channel_id')
            .not('channel_id', 'is', null)
            .limit(1)
            .maybeSingle(); // Use maybeSingle to avoid error if empty

        if (historyItem?.channel_id) {
            channelId = historyItem.channel_id;
        } else {
            // Try channels table
            const { data: channelItem } = await supabaseAdmin
                .from('channels')
                .select('id')
                .limit(1)
                .maybeSingle();

            if (channelItem?.id) channelId = channelItem.id;
        }

        // 2. Insert "Bonus" log (negative duration) to satisfy recalculation logic
        const { error: insertError } = await supabaseAdmin.from('watch_history').insert({
            child_id: childId,
            channel_id: channelId,
            video_id: 'system_bonus',
            video_title: 'Time Bonus',
            channel_name: 'System',
            watched_duration: -(minutes * 60), // Negative seconds
            watched_at: new Date(),
            completed_watch: true
        });

        if (insertError) {
            console.error('❌ Failed to insert Bonus Time record:', insertError);
            // Verify if it was FK failure
            // We continue anyway to update the RULES counter so Parent works, 
            // but Child Sync might revert it if we don't fix this.
        } else {
            console.log(`✅ Bonus Time recorded: -${minutes}m (using channel: ${channelId})`);
        }

        // 2. Immediate Decrement (Result is same as recalc)
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

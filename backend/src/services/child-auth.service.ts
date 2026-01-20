import { supabaseAdmin } from '../config/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';

import { AppError } from '../utils/AppError';
import { HTTP_STATUS } from '../utils/httpStatus';

export class ChildAuthService {
    // Child Login with PIN
    async loginChild(childId: string, pin: string) {
        // 1. Get child data
        // Note: The prompt uses Parents!inner(id) which implies a join.
        // PostgREST syntax for exact relationship might differ slightly depending on FK name.
        // Assuming 'parents' is the correct relation name inferred by Supabase.

        const { data: child, error } = await supabaseAdmin
            .from('children')
            .select('*, parents!inner(id)')
            .eq('id', childId)
            // .eq('is_active', true) // We handle active check explicitly to differentiate errors if needed, but keeping simple
            .single();

        if (error || !child) throw new AppError(`Child not found id ${childId}`, HTTP_STATUS.NOT_FOUND);

        // 0. Check Lockout
        if (child.lockout_until && new Date(child.lockout_until) > new Date()) {
            throw new AppError(`Account locked. Try again after ${new Date(child.lockout_until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, HTTP_STATUS.TOO_MANY_REQUESTS);
        }

        // 2. Verify PIN
        // Assuming pin_hash was stored using bcrypt (which creates $2b$ prefix usually)
        const isPinValid = await bcrypt.compare(pin, child.pin_hash);
        if (!isPinValid) {
            // Log failed attempt & Increment counter
            await this.handleFailedAttempt(childId, (child.failed_pin_attempts || 0) + 1);
            throw new AppError('Invalid PIN', HTTP_STATUS.UNAUTHORIZED);
        }

        // Success: Reset failed attempts
        if (child.failed_pin_attempts > 0 || child.lockout_until) {
            await supabaseAdmin.from('children').update({ failed_pin_attempts: 0, lockout_until: null }).eq('id', childId);
        }

        // 3. Check if paused
        if (child.paused_until && new Date(child.paused_until) > new Date()) {
            throw new AppError('Access is paused until ' + new Date(child.paused_until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), HTTP_STATUS.FORBIDDEN);
        }

        // 4. Check screen time remaining
        const screenTime = await this.checkScreenTimeRemaining(childId);
        if (screenTime.remaining <= 0) {
            throw new AppError('Your watch time is over for today! Try again tomorrow 🌟', HTTP_STATUS.FORBIDDEN);
        }

        // 5. Check allowed hours
        const isAllowedTime = await this.checkAllowedHours(childId);
        if (!isAllowedTime) {
            throw new AppError('It\'s sleep time! See you in the morning 🌙', HTTP_STATUS.FORBIDDEN);
        }

        // 6. Generate child session token (2 hour expiry)
        const secret = env.JWT_SECRET;

        const token = jwt.sign(
            {
                childId: child.id,
                parentId: child.parent_id,
                type: 'child'
            },
            secret,
            { expiresIn: '2h' }
        );

        // 7. Log login activity
        await this.logChildLogin(childId);

        // 8. Create session record
        await this.createSession(childId, token);

        return {
            child: {
                id: child.id,
                name: child.name,
                avatar: child.avatar,
                age: child.age
            },
            token,
            screenTime: screenTime.remaining
        };
    }

    // Verify Child Token
    async verifyChildToken(token: string) {
        try {
            const secret = env.JWT_SECRET;
            const decoded = jwt.verify(token, secret) as any;

            if (decoded.type !== 'child') {
                throw new Error('Invalid token type');
            }

            // Check if session is still active
            const { data: session, error } = await supabaseAdmin
                .from('child_sessions')
                .select('*')
                .eq('child_id', decoded.childId)
                .eq('token_hash', this.hashToken(token))
                .eq('is_active', true)
                .single();

            // if (error || !session) {
            //     throw new Error('Session expired');
            // }

            return decoded;
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    // Helper Functions
    private async checkScreenTimeRemaining(childId: string) {
        const { data, error } = await supabaseAdmin
            .from('screen_time_rules')
            .select('daily_limit_minutes, today_usage_minutes')
            .eq('child_id', childId)
            .single();

        if (error || !data) return { remaining: 60 }; // default

        const remaining = data.daily_limit_minutes - data.today_usage_minutes;
        return { remaining: Math.max(0, remaining) };
    }

    private async checkAllowedHours(childId: string): Promise<boolean> {
        const { data } = await supabaseAdmin
            .from('screen_time_rules')
            .select('allowed_time_windows, bedtime_mode')
            .eq('child_id', childId)
            .single();

        if (!data) return true;

        const now = new Date();
        const currentHour = now.getHours();
        const currentDay = now.getDay();

        // Check bedtime mode
        if (data.bedtime_mode?.enabled && data.bedtime_mode?.startTime && data.bedtime_mode?.endTime) {
            const bedtimeStart = parseInt(data.bedtime_mode.startTime.split(':')[0]);
            const bedtimeEnd = parseInt(data.bedtime_mode.endTime.split(':')[0]);

            // Handle crossing midnight
            if (bedtimeStart > bedtimeEnd) {
                if (currentHour >= bedtimeStart || currentHour < bedtimeEnd) return false;
            } else {
                if (currentHour >= bedtimeStart && currentHour < bedtimeEnd) return false;
            }
        }

        // Check allowed time windows
        if (data.allowed_time_windows?.length > 0) {
            // Assuming structure is [{dayOfWeek: 1, startTime: '08:00', endTime: '20:00'}, ...]
            // Note: User prompt logic used .some(), essentially checking if *any* window is valid.
            // If windows exist for ANY day, we check if one matches TODAY and CURRENT HOUR.

            const todayWindows = data.allowed_time_windows.filter(
                (w: any) => w.dayOfWeek === currentDay
            );

            if (todayWindows.length === 0) {
                // If there are explicit windows for OTHER days but none for today, is it allowed?
                // Usually "whitelist" logic implies if windows exist at all, only those are allowed.
                // Assuming strict whitelist if array is non-empty.
                return false;
            }

            return todayWindows.some((window: any) => {
                const start = parseInt(window.startTime.split(':')[0]);
                const end = parseInt(window.endTime.split(':')[0]);
                return currentHour >= start && currentHour < end;
            });
        }

        return true;
    }

    private async logChildLogin(childId: string) {
        await supabaseAdmin
            .from('activity_logs')
            .insert({
                child_id: childId,
                type: 'child_login',
                timestamp: new Date().toISOString()
            });
    }

    private async handleFailedAttempt(childId: string, newCount: number) {
        const updates: any = { failed_pin_attempts: newCount };

        // Lockout logic: 3 apptempts
        if (newCount >= 3) {
            updates.lockout_until = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes lock
            // Send Notification to Parent logic would go here
            await this.notifyParentOfLockout(childId);
        }

        await supabaseAdmin.from('children').update(updates).eq('id', childId);

        await supabaseAdmin
            .from('activity_logs')
            .insert({
                child_id: childId,
                type: 'failed_pin_attempt',
                data: { attempt: newCount, locked: newCount >= 3 },
                timestamp: new Date().toISOString()
            });
    }

    private async notifyParentOfLockout(childId: string) {
        // Stub for notification service
        // In real impl, would insert into 'notifications' table
        const { data: child } = await supabaseAdmin.from('children').select('parent_id, name').eq('id', childId).single();
        if (child) {
            await supabaseAdmin.from('notifications').insert({
                parent_id: child.parent_id,
                child_id: childId,
                type: 'security_alert',
                title: 'Child Account Locked',
                message: `Too many failed PIN attempts for ${child.name}. Account locked for 15 minutes.`,
                priority: 'high'
            });
        }
    }

    private hashToken(token: string): string {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    private async createSession(childId: string, token: string) {
        await supabaseAdmin
            .from('child_sessions')
            .insert({
                child_id: childId,
                token_hash: this.hashToken(token),
                expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
                is_active: true
            });
    }
}

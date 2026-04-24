import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { HTTP_STATUS } from '../utils/httpStatus';
import { getLocalDateString, getStartOfLocalDay } from '../utils/dateUtils';
import { socketService } from '../services/websocket.service';

export class ScreenTimeService {

    async getRules(childId: string) {
        let rules = await prisma.screenTimeRule.findUnique({
            where: { childId },
        });

        if (!rules) {
            // Create defaults if missing
            rules = await prisma.screenTimeRule.create({
                data: { childId },
            });
        }

        return rules;
    }

    async updateRules(childId: string, updates: any) {
        // Map snake_case to camelCase for robust handling of legacy or mixed inputs
        const mappedUpdates: any = { ...updates };
        
        const keyMap: Record<string, string> = {
            'daily_limit_minutes': 'dailyLimitMinutes',
            'weekday_limit_minutes': 'weekdayLimitMinutes',
            'weekend_limit_minutes': 'weekendLimitMinutes',
            'allowed_time_windows': 'allowedTimeWindows',
            'bedtime_mode': 'bedtimeMode',
            'break_reminder_enabled': 'breakReminderEnabled',
            'break_reminder_interval': 'breakReminderInterval',
            'today_usage_minutes': 'todayUsageMinutes',
            'last_reset_date': 'lastResetDate'
        };

        Object.entries(keyMap).forEach(([snake, camel]) => {
            if (updates[snake] !== undefined && updates[camel] === undefined) {
                mappedUpdates[camel] = updates[snake];
            }
        });

        // Strict whitelist of allowed fields to prevent Prisma validation errors
        const allowedFields = [
            'dailyLimitMinutes',
            'weekdayLimitMinutes',
            'weekendLimitMinutes',
            'allowedTimeWindows',
            'bedtimeMode',
            'breakReminderEnabled',
            'breakReminderInterval',
            'todayUsageMinutes',
            'lastResetDate'
        ];

        const cleanUpdates = Object.keys(mappedUpdates)
            .filter(key => allowedFields.includes(key))
            .reduce((obj: any, key) => {
                obj[key] = mappedUpdates[key];
                return obj;
            }, {});

        return prisma.screenTimeRule.update({
            where: { childId },
            data: cleanUpdates,
        });
    }

    async setPauseStatus(childId: string, isPaused: boolean) {
        return prisma.child.update({
            where: { id: childId },
            data: { 
                isActive: !isPaused,
                pauseReason: isPaused ? 'Paused by parent' : null,
                pausedUntil: null
            }
        });
    }

    async getDetailedStatus(childId: string) {
        const rules = await this.getRules(childId);

        // Reset daily usage column if it's a new day (use LOCAL time)
        const now = new Date();
        const todayLocalStr = getLocalDateString(now);

        let lastResetLocalStr: string;
        if (rules.lastResetDate instanceof Date) {
            lastResetLocalStr = getLocalDateString(rules.lastResetDate);
        } else {
            lastResetLocalStr = String(rules.lastResetDate);
        }

        if (lastResetLocalStr !== todayLocalStr) {
            await prisma.screenTimeRule.update({
                where: { childId },
                data: { todayUsageMinutes: 0, lastResetDate: now },
            });
        }

        // Calculate actual usage from WatchHistory for TODAY
        const startOfToday = getStartOfLocalDay();

        const history = await prisma.watchHistory.findMany({
            where: {
                childId,
                watchedAt: { gte: startOfToday },
                wasBlocked: false,
            },
            select: { watchedDuration: true },
        });

        const totalUsedSeconds = history.reduce((sum, h) => sum + (h.watchedDuration ?? 0), 0);
        const todayUsage = totalUsedSeconds / 60; // Fractional minutes

        // Determine limit for today
        const dayOfWeek = new Date().getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const limit = isWeekend
            ? (rules.weekendLimitMinutes ?? rules.dailyLimitMinutes)
            : (rules.weekdayLimitMinutes ?? rules.dailyLimitMinutes);

        // Get Child overall status (isPaused)
        const child = await prisma.child.findUnique({
            where: { id: childId },
            select: { isActive: true, pauseReason: true }
        });

        // Auto-pause child if time has run out and child is not already paused
        const remaining = limit - todayUsage;
        if (remaining <= 0 && child && child.isActive) {
            await this.setPauseStatus(childId, true);
            // Update child status after pausing
            const updatedChild = await prisma.child.findUnique({
                where: { id: childId },
                select: { isActive: true }
            });
            return {
                remaining: 0,
                used: todayUsage,
                limit: limit,
                isPaused: true
            };
        }

        return {
            remaining: Math.max(0, remaining),
            used: todayUsage,
            limit: limit,
            isPaused: child ? !child.isActive : false
        };
    }

    async grantExtraTime(childId: string, minutes: number) {
        // Implement logic to temporarily increase today's limit
        // Or track extra granted time separately
        return;
    }

    async checkAndUpdateUsage(childId: string, additionalMinutes: number): Promise<{
        allowed: boolean;
        remainingMinutes: number;
        limitReached: boolean;
    }> {
        const rules = await this.getRules(childId);

        // Reset daily usage if it's a new day (use LOCAL time, not UTC)
        const now = new Date();
        const todayLocalStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

        let lastResetLocalStr: string;
        if (rules.lastResetDate instanceof Date) {
            const resetDate = rules.lastResetDate;
            lastResetLocalStr = `${resetDate.getFullYear()}-${(resetDate.getMonth() + 1).toString().padStart(2, '0')}-${resetDate.getDate().toString().padStart(2, '0')}`;
        } else {
            lastResetLocalStr = String(rules.lastResetDate);
        }

        if (lastResetLocalStr !== todayLocalStr) {
            await prisma.screenTimeRule.update({
                where: { childId },
                data: { todayUsageMinutes: 0, lastResetDate: now },
            });
            rules.todayUsageMinutes = 0;
        }

        // Determine limit for today (weekday vs weekend)
        const dayOfWeek = new Date().getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const limit = isWeekend
            ? (rules.weekendLimitMinutes ?? rules.dailyLimitMinutes)
            : (rules.weekdayLimitMinutes ?? rules.dailyLimitMinutes);

        // Calculate actual usage from WatchHistory for consistency with getDetailedStatus
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const history = await prisma.watchHistory.findMany({
            where: {
                childId,
                watchedAt: { gte: startOfToday },
                wasBlocked: false,
            },
            select: { watchedDuration: true },
        });

        const totalUsedSeconds = history.reduce((sum, h) => sum + (h.watchedDuration ?? 0), 0);
        const actualUsage = totalUsedSeconds / 60;
        const newUsage = actualUsage + additionalMinutes;
        const allowed = newUsage <= limit;

        // Auto-pause if limit is reached
        if (newUsage >= limit && allowed) {
            await this.setPauseStatus(childId, true);
            // Emit real-time notification
            socketService.emitToChild(childId, 'settings:updated', {});
        }

        // Keep todayUsageMinutes updated for quick reference
        await prisma.screenTimeRule.update({
            where: { childId },
            data: { todayUsageMinutes: newUsage },
        });

        return {
            allowed,
            // Return exact remaining minutes to avoid precision issues
            remainingMinutes: Math.max(0, limit - newUsage),
            limitReached: newUsage >= limit,
        };
    }

    async getUsageStatus(childId: string) {
        const rules = await this.getRules(childId);

        // Calculate actual usage from WatchHistory for TODAY
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const history = await prisma.watchHistory.findMany({
            where: {
                childId,
                watchedAt: { gte: startOfToday },
                wasBlocked: false,
            },
            select: { watchedDuration: true },
        });

        const totalUsedSeconds = history.reduce((sum, h) => sum + (h.watchedDuration ?? 0), 0);
        const todayUsage = totalUsedSeconds / 60;

        const dayOfWeek = new Date().getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const limit = isWeekend
            ? (rules.weekendLimitMinutes ?? rules.dailyLimitMinutes)
            : (rules.weekdayLimitMinutes ?? rules.dailyLimitMinutes);

        return {
            todayUsageMinutes: todayUsage,
            dailyLimitMinutes: limit,
            // Return exact remaining minutes to avoid precision issues
            remainingMinutes: Math.max(0, limit - todayUsage),
            isLimitReached: todayUsage >= limit,
            percentUsed: Math.min(100, Math.round((todayUsage / limit) * 100)),
        };
    }

    async isWithinAllowedWindow(childId: string): Promise<boolean> {
        const rules = await this.getRules(childId);
        const windows = rules.allowedTimeWindows as Array<{
            start: string;
            end: string;
            days?: number[];
        }>;

        if (!windows || windows.length === 0) return true;

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentDay = now.getDay();
        const currentTime = currentHour * 60 + currentMinute;

        return windows.some(window => {
            if (window.days && !window.days.includes(currentDay)) return false;

            const [startH, startM] = window.start.split(':').map(Number);
            const [endH, endM] = window.end.split(':').map(Number);
            const windowStart = startH * 60 + startM;
            const windowEnd = endH * 60 + endM;

            return currentTime >= windowStart && currentTime <= windowEnd;
        });
    }

    async isBedtime(childId: string): Promise<boolean> {
        const rules = await this.getRules(childId);
        const bedtime = rules.bedtimeMode as { enabled: boolean; start?: string; end?: string };

        if (!bedtime.enabled) return false;
        if (!bedtime.start || !bedtime.end) return false;

        const now = new Date();
        const [startH, startM] = bedtime.start.split(':').map(Number);
        const [endH, endM] = bedtime.end.split(':').map(Number);

        const currentTime = now.getHours() * 60 + now.getMinutes();
        const bedStart = startH * 60 + startM;
        const bedEnd = endH * 60 + endM;

        if (bedStart > bedEnd) {
            // Spans midnight
            return currentTime >= bedStart || currentTime <= bedEnd;
        }
        return currentTime >= bedStart && currentTime <= bedEnd;
    }

    async recordUsage(childId: string, minutes: number) {
        await prisma.screenTimeRule.update({
            where: { childId },
            data: {
                todayUsageMinutes: { increment: minutes },
            },
        });
    }

    async pauseForToday(childId: string) {
        const rules = await this.getRules(childId);
        await prisma.screenTimeRule.update({
            where: { childId },
            data: { todayUsageMinutes: rules.dailyLimitMinutes },
        });
        return { success: true };
    }
}

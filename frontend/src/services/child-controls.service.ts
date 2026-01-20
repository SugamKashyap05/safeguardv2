import { api } from './api';

export interface ScreenTimeRules {
    id: string;
    child_id: string;
    daily_limit_minutes: number;
    weekday_limit_minutes?: number;
    weekend_limit_minutes?: number;
    allowed_time_windows: TimeWindow[];
    bedtime_mode: {
        enabled: boolean;
        startTime?: string;
        endTime?: string;
    };
    break_reminder_enabled: boolean;
    break_reminder_interval: number;
    today_usage_minutes: number;
}

interface TimeWindow {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}

export const ChildControlsService = {
    // Screen Time
    async getScreenTimeRules(childId: string): Promise<ScreenTimeRules> {
        const response = await api.get<{ success: boolean; data: ScreenTimeRules }>(`/screentime/${childId}`);
        return response.data.data;
    },

    async updateScreenTimeRules(childId: string, rules: Partial<ScreenTimeRules>): Promise<void> {
        await api.put(`/screentime/${childId}`, rules);
    },

    async extendTime(childId: string, minutes: number): Promise<void> {
        await api.post(`/screentime/${childId}/extend`, { minutes });
    },

    async pauseChild(childId: string): Promise<void> {
        await api.post(`/screentime/${childId}/pause`);
    },

    async resumeChild(childId: string): Promise<void> {
        await api.post(`/screentime/${childId}/resume`);
    },

    async getRemainingTime(childId: string): Promise<number> {
        const response = await api.get<{ success: boolean; data: { minutes: number } }>(`/screentime/${childId}/remaining`);
        return response.data.data.minutes;
    },

    // Content Filters  
    async getContentFilters(childId: string): Promise<any> {
        const response = await api.get(`/content-filter/${childId}`);
        return response.data.data;
    },

    async updateContentFilters(childId: string, filters: any): Promise<void> {
        await api.put(`/content-filter/${childId}`, filters);
    },

    // Child Info
    async getChild(childId: string): Promise<any> {
        const response = await api.get(`/children/${childId}`);
        return response.data.data;
    },

    async updateChild(childId: string, updates: any): Promise<any> {
        const response = await api.put(`/children/${childId}`, updates);
        return response.data.data;
    }
};

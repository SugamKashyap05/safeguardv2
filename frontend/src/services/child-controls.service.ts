import { api } from './api';

export interface ScreenTimeRules {
    id: string;
    childId: string;
    dailyLimitMinutes: number;
    weekdayLimitMinutes?: number;
    weekendLimitMinutes?: number;
    allowedTimeWindows: TimeWindow[];
    bedtimeMode: {
        enabled: boolean;
        startTime?: string;
        endTime?: string;
    };
    breakReminderEnabled: boolean;
    breakReminderInterval: number;
    todayUsageMinutes: number;
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
        await api.post(`/emergency/pause/${childId}`, { reason: 'Parent Toggle', duration: 0 });
    },

    async resumeChild(childId: string): Promise<void> {
        await api.post(`/emergency/resume/${childId}`);
    },

    async getRemainingTime(childId: string): Promise<number> {
        const response = await api.get<{ success: boolean; data: { minutes: number } }>(`/screentime/${childId}/remaining`);
        return response.data.data.minutes;
    },

    // Content Filters  
    async getContentFilters(childId: string): Promise<any> {
        const response = await api.get(`/filters/${childId}`);
        return response.data.data;
    },

    async updateContentFilters(childId: string, filters: any): Promise<void> {
        await api.put(`/filters/${childId}`, filters);
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

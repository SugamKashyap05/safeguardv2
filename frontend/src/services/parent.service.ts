import { api } from './api';

export interface ParentSettings {
    id: string;
    name: string;
    email: string;
    phone_number?: string;
    notification_preferences: {
        email: boolean;
        push: boolean;
        sms: boolean;
    };
    subscription_tier: 'free' | 'premium' | 'family';
}

export const ParentService = {
    async getSettings(): Promise<ParentSettings> {
        const response = await api.get<{ success: boolean; data: ParentSettings }>('/parents/settings');
        return response.data.data;
    },

    async updateSettings(settings: Partial<{
        name: string;
        phone_number: string;
        notification_preferences: {
            email?: boolean;
            push?: boolean;
            sms?: boolean;
        };
    }>): Promise<ParentSettings> {
        const response = await api.put<{ success: boolean; data: ParentSettings }>('/parents/settings', settings);
        return response.data.data;
    },

    async changePassword(newPassword: string): Promise<void> {
        await api.post('/parents/change-password', { newPassword });
    },

    async getProfile(): Promise<any> {
        const response = await api.get('/parents/me');
        return response.data.data;
    }
};

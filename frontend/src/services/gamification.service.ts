
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    is_earned: boolean;
    earned_at: string | null;
    category: 'knowledge' | 'consistency' | 'completion' | 'special';
    rarity: string;
    condition_description: string;
}

export interface DailyQuest {
    id: string;
    type: 'watch_time' | 'stars_earned' | 'videos_watched';
    target: number;
    progress: number;
    is_completed: boolean;
    reward_stars: number;
    description?: string; // Derived in frontend or sent from backend
}

export const gamificationService = {
    getBadges: async (childId: string): Promise<Badge[]> => {
        const response = await axios.get(`${API_URL}/gamification/${childId}/badges`);
        return response.data.data;
    },

    getStats: async (childId: string): Promise<{ stars: number; total_stars_earned: number }> => {
        const response = await axios.get(`${API_URL}/children/${childId}/status`);
        return {
            stars: response.data.data.stars || 0,
            total_stars_earned: response.data.data.totalStars || 0
        };
    },

    getDailyQuests: async (childId: string): Promise<DailyQuest[]> => {
        const response = await axios.get(`${API_URL}/quests/${childId}`);
        return response.data.data;
    },

    // Shop
    getShopItems: async () => {
        const response = await axios.get(`${API_URL}/shop/items`);
        return response.data.data;
    },

    getInventory: async (childId: string) => {
        const response = await axios.get(`${API_URL}/shop/${childId}/inventory`);
        return response.data.data;
    },

    buyItem: async (childId: string, itemId: string) => {
        const response = await axios.post(`${API_URL}/shop/${childId}/buy`, { itemId });
        return response.data;
    },

    saveAvatar: async (childId: string, config: any) => {
        const response = await axios.post(`${API_URL}/shop/${childId}/avatar`, { config });
        return response.data;
    },

    // For testing/dev mainly
    awardStars: async (childId: string, amount: number, reason: string) => {
        const response = await axios.post(`${API_URL}/gamification/stars`, {
            childId,
            amount,
            reason
        });
        return response.data.data;
    }
};

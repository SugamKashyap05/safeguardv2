import { api } from './api';

export const AuthService = {
    async signup(data: any) {
        const response = await api.post('/auth/parent/signup', data);
        return response.data;
    },

    async login(data: any) {
        const response = await api.post('/auth/parent/login', data);
        if (response.data.success) {
            localStorage.setItem('safeguard_token', response.data.data.session.access_token);
        }
        return response.data;
    },

    async updateOnboarding(step: number) {
        const response = await api.put('/parents/onboarding', { step });
        return response.data;
    }
};

export const ChildService = {
    async getAll() {
        const response = await api.get('/children');
        return response.data;
    },

    async create(data: any) {
        const response = await api.post('/children', data);
        return response.data;
    },

    async update(id: string, data: any) {
        const response = await api.put(`/children/${id}`, data);
        return response.data;
    },

    async delete(id: string) {
        const response = await api.delete(`/children/${id}`);
        return response.data;
    },

    async verifyPin(childId: string, pin: string) {
        const response = await api.post('/children/verify-pin', { child_id: childId, pin });
        return response.data;
    }
};

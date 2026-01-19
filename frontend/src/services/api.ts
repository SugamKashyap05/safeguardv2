import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add interceptor for token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('safeguard_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

import { api } from './api';

export interface ApprovalRequest {
    id: string;
    child_id: string;
    video_id?: string;
    channel_id?: string;
    status: 'pending' | 'approved' | 'rejected';
    requested_at: string;
    metadata?: any;
    video_title?: string;
    channel_name?: string;
    thumbnail_url?: string;
}

export const ApprovalService = {
    async requestVideoAccess(videoId: string, reason?: string): Promise<void> {
        await api.post('/approvals/request', { videoId, reason, type: 'video' });
    },

    async requestChannelAccess(channelId: string, reason?: string): Promise<void> {
        await api.post('/approvals/request', { channelId, reason, type: 'channel' });
    },

    async getHistory(status?: 'pending' | 'approved' | 'rejected'): Promise<ApprovalRequest[]> {
        const response = await api.get<{ success: boolean; data: ApprovalRequest[] }>('/approvals/history', {
            params: { status }
        });
        return response.data.data;
    },

    // Parent methods (can be here or moved to ParentService if strict separation needed)
    async getPendingRequests(): Promise<ApprovalRequest[]> {
        const response = await api.get<{ success: boolean; data: ApprovalRequest[] }>('/approvals/pending');
        return response.data.data;
    },

    async reviewRequest(requestId: string, action: 'approve' | 'reject'): Promise<void> {
        await api.post(`/approvals/${requestId}/review`, { action });
    }
};

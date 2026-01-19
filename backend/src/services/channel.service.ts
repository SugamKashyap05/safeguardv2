import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';
import { HTTP_STATUS } from '../utils/httpStatus';
import { NotificationService } from './notification.service';

const notificationService = new NotificationService();

interface ChannelRequest {
    childId: string;
    channelId: string;
    channelName: string;
    thumbnailUrl?: string;
}

export class ChannelService {

    /**
     * Get Approved Channels
     */
    async getApprovedChannels(childId: string) {
        const { data, error } = await supabaseAdmin
            .from('approved_channels')
            .select('*')
            .eq('child_id', childId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    /**
     * Get Pending Requests (filtered by status='pending' and channel_id is not null)
     */
    async getPendingRequests(childId: string) {
        const { data, error } = await supabaseAdmin
            .from('approval_requests')
            .select('*')
            .eq('child_id', childId)
            .eq('status', 'pending')
            .not('channel_id', 'is', null); // Making sure it's a channel request

        if (error) throw error;
        return data;
    }

    /**
     * Request Channel Approval (Child Action)
     */
    async requestChannel(data: ChannelRequest) {
        // Check if already requested or approved
        const { data: existing } = await supabaseAdmin
            .from('approved_channels')
            .select('id')
            .eq('child_id', data.childId)
            .eq('channel_id', data.channelId)
            .single();

        if (existing) throw new AppError('Channel already approved', HTTP_STATUS.CONFLICT);

        const { data: pending } = await supabaseAdmin
            .from('approval_requests')
            .select('id')
            .eq('child_id', data.childId)
            .eq('channel_id', data.channelId)
            .eq('status', 'pending')
            .single();

        if (pending) throw new AppError('Request already pending', HTTP_STATUS.CONFLICT);

        const { data: request, error } = await supabaseAdmin
            .from('approval_requests')
            .insert({
                child_id: data.childId,
                channel_id: data.channelId,
                channel_name: data.channelName,
                channel_thumbnail_url: data.thumbnailUrl,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        // NEW: Notify Parent
        // We need to find the parent ID. The child row has parent_id. 
        // Ideally we fetch it first.
        const { data: child } = await supabaseAdmin.from('children').select('parent_id, name').eq('id', data.childId).single();
        if (child) {
            await notificationService.create({
                parentId: child.parent_id,
                childId: data.childId,
                type: 'channel_request',
                title: 'New Channel Request',
                message: `${child.name} asked to approve: ${data.channelName}`,
                actionUrl: `/parent/channels/${data.childId}`,
                priority: 'medium'
            });
        }

        return request;
    }

    /**
     * Approve Channel (Parent Action)
     */
    async approveChannel(requestId: string, parentId: string, notes?: string) {
        // 1. Get Request
        const { data: request } = await supabaseAdmin
            .from('approval_requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (!request) throw new AppError('Request not found', HTTP_STATUS.NOT_FOUND);

        // 2. Add to Approved Channels
        const { error: insertError } = await supabaseAdmin
            .from('approved_channels')
            .insert({
                child_id: request.child_id,
                channel_id: request.channel_id,
                channel_name: request.channel_name,
                channel_thumbnail_url: request.channel_thumbnail_url,
                approved_by: parentId
            });

        if (insertError) throw insertError;

        // 3. Update Request Status
        await supabaseAdmin
            .from('approval_requests')
            .update({ status: 'approved', notes, parent_id: parentId })
            .eq('id', requestId);

        return true;
    }

    /**
     * Direct Approve (without request)
     */
    async directApprove(childId: string, channel: any, parentId: string) {
        const { error } = await supabaseAdmin
            .from('approved_channels')
            .insert({
                child_id: childId,
                channel_id: channel.channelId,
                channel_name: channel.channelName,
                channel_thumbnail_url: channel.thumbnailUrl,
                approved_by: parentId
            });

        if (error) throw error;
        return true;
    }

    /**
     * Reject Channel
     */
    async rejectChannel(requestId: string, parentId: string, notes?: string) {
        const { error } = await supabaseAdmin
            .from('approval_requests')
            .update({ status: 'rejected', notes, parent_id: parentId })
            .eq('id', requestId);

        if (error) throw error;
        return true;
    }

    /**
     * Remove Approval
     */
    async removeChannel(channelId: string, childId: string) {
        const { error } = await supabaseAdmin
            .from('approved_channels')
            .delete()
            .eq('channel_id', channelId)
            .eq('child_id', childId);

        if (error) throw error;
        return true;
    }

    /**
     * Get Curated Discovery Lists
     */
    async getDiscoveryLists() {
        // In a real app, this would query a "curated_channels" table or external API.
        // For MVP, we return static mock data categorized by age/topic.
        return {
            education: [
                { id: 'UCsooa4yRKGN_zEE8iknghZA', title: 'TED-Ed', thumbnail: 'https://yt3.googleusercontent.com/ytc/AIdro_kw5j-kXz2X9H4v5j5X5H5X5H5X5H5X5H5X5H5=s160-c-k-c0x00ffffff-no-rj' },
                { id: 'UC3ScyryU9Ay_4j4NeWms_3A', title: 'SciShow Kids', thumbnail: 'https://yt3.googleusercontent.com/ytc/AIdro_kw5j-kXz2X9H4v5j5X5H5X5H5X5H5X5H5X5H5=s160-c-k-c0x00ffffff-no-rj' },
            ],
            music: [
                { id: 'UCbCmjCuTUZos6Inko4u57UQ', title: 'Cocomelon', thumbnail: 'https://yt3.googleusercontent.com/ytc/AIdro_kw5j-kXz2X9H4v5j5X5H5X5H5X5H5X5H5X5H5=s160-c-k-c0x00ffffff-no-rj' },
            ],
            arts: [
                { id: 'UC5XOg1nd_iL2x8p9c5X5X5w', title: 'Art for Kids Hub', thumbnail: 'https://yt3.googleusercontent.com/ytc/AIdro_kw5j-kXz2X9H4v5j5X5H5X5H5X5H5X5H5X5H5=s160-c-k-c0x00ffffff-no-rj' }
            ]
        };
    }
}

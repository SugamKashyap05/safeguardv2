import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';
import { HTTP_STATUS } from '../utils/httpStatus';

interface VideoDetails {
    videoId: string;
    title: string;
    thumbnail: string;
    channelId: string;
    channelName: string;
    duration?: number;
}

interface ApprovalRequest {
    id: string;
    child_id: string;
    request_type: 'video' | 'channel';
    video_id?: string;
    video_title?: string;
    video_thumbnail?: string;
    duration?: number;
    channel_id: string;
    channel_name?: string;
    channel_thumbnail?: string;
    subscriber_count?: number;
    status: 'pending' | 'approved' | 'rejected';
    child_message?: string;
    parent_notes?: string;
    requested_at: string;
    reviewed_at?: string;
    reviewed_by?: string;
}

export class ApprovalService {

    /**
     * Child requests approval for a video
     */
    async requestVideoApproval(
        childId: string,
        videoDetails: VideoDetails,
        message?: string
    ): Promise<ApprovalRequest> {
        // Check for existing pending request for same video
        const { data: existing } = await supabaseAdmin
            .from('approval_requests')
            .select('id')
            .eq('child_id', childId)
            .eq('video_id', videoDetails.videoId)
            .eq('status', 'pending')
            .single();

        if (existing) {
            throw new AppError('You already requested this video', HTTP_STATUS.CONFLICT);
        }

        // Create the approval request
        const { data: request, error } = await supabaseAdmin
            .from('approval_requests')
            .insert({
                child_id: childId,
                request_type: 'video',
                video_id: videoDetails.videoId,
                video_title: videoDetails.title,
                video_thumbnail: videoDetails.thumbnail,
                channel_id: videoDetails.channelId,
                channel_name: videoDetails.channelName,
                duration: videoDetails.duration,
                status: 'pending',
                child_message: message,
                requested_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw new AppError('Failed to create request', HTTP_STATUS.INTERNAL_SERVER_ERROR);

        // Get child info for notification
        const { data: child } = await supabaseAdmin
            .from('children')
            .select('name, parent_id')
            .eq('id', childId)
            .single();

        // Notify parent
        if (child) {
            await supabaseAdmin.from('notifications').insert({
                parent_id: child.parent_id,
                child_id: childId,
                type: 'approval_request',
                title: 'New Approval Request',
                message: `${child.name} wants to watch: ${videoDetails.title}`,
                priority: 'normal',
                data: { requestId: request.id, videoId: videoDetails.videoId }
            });
        }

        return request;
    }

    /**
     * Child requests approval for a channel
     */
    async requestChannelApproval(
        childId: string,
        channelId: string,
        channelName: string,
        channelThumbnail?: string,
        message?: string
    ): Promise<ApprovalRequest> {
        // Check for existing pending request
        const { data: existing } = await supabaseAdmin
            .from('approval_requests')
            .select('id')
            .eq('child_id', childId)
            .eq('channel_id', channelId)
            .eq('request_type', 'channel')
            .eq('status', 'pending')
            .single();

        if (existing) {
            throw new AppError('You already requested this channel', HTTP_STATUS.CONFLICT);
        }

        const { data: request, error } = await supabaseAdmin
            .from('approval_requests')
            .insert({
                child_id: childId,
                request_type: 'channel',
                channel_id: channelId,
                channel_name: channelName,
                channel_thumbnail: channelThumbnail,
                status: 'pending',
                child_message: message,
                requested_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw new AppError('Failed to create request', HTTP_STATUS.INTERNAL_SERVER_ERROR);

        // Get child info for notification
        const { data: child } = await supabaseAdmin
            .from('children')
            .select('name, parent_id')
            .eq('id', childId)
            .single();

        if (child) {
            await supabaseAdmin.from('notifications').insert({
                parent_id: child.parent_id,
                child_id: childId,
                type: 'approval_request',
                title: 'Channel Approval Request',
                message: `${child.name} wants access to channel: ${channelName}`,
                priority: 'normal',
                data: { requestId: request.id, channelId }
            });
        }

        return request;
    }

    /**
     * Get pending requests for parent
     */
    async getPendingRequests(parentId: string): Promise<ApprovalRequest[]> {
        // Get all children for this parent
        const { data: children } = await supabaseAdmin
            .from('children')
            .select('id')
            .eq('parent_id', parentId);

        if (!children || children.length === 0) return [];

        const childIds = children.map(c => c.id);

        const { data: requests, error } = await supabaseAdmin
            .from('approval_requests')
            .select(`
                *,
                children:child_id (name, avatar)
            `)
            .in('child_id', childIds)
            .eq('status', 'pending')
            .order('requested_at', { ascending: false });

        if (error) throw new AppError('Failed to get requests', HTTP_STATUS.INTERNAL_SERVER_ERROR);

        return requests || [];
    }

    /**
     * Get request history for parent
     */
    async getRequestHistory(parentId: string, status?: string): Promise<ApprovalRequest[]> {
        const { data: children } = await supabaseAdmin
            .from('children')
            .select('id')
            .eq('parent_id', parentId);

        if (!children || children.length === 0) return [];

        const childIds = children.map(c => c.id);

        let query = supabaseAdmin
            .from('approval_requests')
            .select(`
                *,
                children:child_id (name, avatar)
            `)
            .in('child_id', childIds)
            .order('requested_at', { ascending: false })
            .limit(50);

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data: requests, error } = await query;

        if (error) throw new AppError('Failed to get history', HTTP_STATUS.INTERNAL_SERVER_ERROR);

        return requests || [];
    }

    /**
     * Parent reviews (approves/rejects) a request
     */
    async reviewRequest(
        requestId: string,
        decision: 'approve' | 'reject',
        parentId: string,
        notes?: string
    ): Promise<ApprovalRequest> {
        // Get the request
        const { data: request, error: fetchError } = await supabaseAdmin
            .from('approval_requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (fetchError || !request) {
            throw new AppError('Request not found', HTTP_STATUS.NOT_FOUND);
        }

        // Verify parent owns this child
        const { data: child } = await supabaseAdmin
            .from('children')
            .select('parent_id, name')
            .eq('id', request.child_id)
            .single();

        if (!child || child.parent_id !== parentId) {
            throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN);
        }

        const newStatus = decision === 'approve' ? 'approved' : 'rejected';

        // Update the request
        const { data: updated, error: updateError } = await supabaseAdmin
            .from('approval_requests')
            .update({
                status: newStatus,
                reviewed_at: new Date().toISOString(),
                reviewed_by: parentId,
                parent_notes: notes
            })
            .eq('id', requestId)
            .select()
            .single();

        if (updateError) throw new AppError('Failed to update request', HTTP_STATUS.INTERNAL_SERVER_ERROR);

        // If approved, add to approved list
        if (decision === 'approve') {
            if (request.request_type === 'video') {
                // Add video to approved videos (one-time watch)
                await supabaseAdmin.from('approved_videos').upsert({
                    child_id: request.child_id,
                    video_id: request.video_id,
                    approved_by: parentId,
                    approved_at: new Date().toISOString()
                }, { onConflict: 'child_id,video_id' });
            } else {
                // Add channel to approved channels
                await supabaseAdmin.from('approved_channels').upsert({
                    child_id: request.child_id,
                    channel_id: request.channel_id,
                    channel_name: request.channel_name,
                    channel_thumbnail_url: request.channel_thumbnail,
                    approved_by: parentId,
                    approved_at: new Date().toISOString()
                }, { onConflict: 'child_id,channel_id' });
            }
        }

        // Notify child
        await supabaseAdmin.from('child_notifications').insert({
            child_id: request.child_id,
            type: decision === 'approve' ? 'request_approved' : 'request_rejected',
            title: decision === 'approve' ? 'Request Approved! 🎉' : 'Request Not Approved',
            message: decision === 'approve'
                ? `Your parent approved "${request.video_title || request.channel_name}"!`
                : `Your parent said not this time for "${request.video_title || request.channel_name}"`,
            data: { requestId }
        });

        return updated;
    }

    /**
     * Quick approve - approves video AND adds entire channel
     */
    async quickApproveChannel(requestId: string, parentId: string): Promise<{ approved: boolean; channelAdded: boolean }> {
        // First approve the video request
        await this.reviewRequest(requestId, 'approve', parentId);

        // Get the request to get channel info
        const { data: request } = await supabaseAdmin
            .from('approval_requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (request) {
            // Also add channel to approved list
            await supabaseAdmin.from('approved_channels').upsert({
                child_id: request.child_id,
                channel_id: request.channel_id,
                channel_name: request.channel_name,
                channel_thumbnail_url: request.channel_thumbnail,
                approved_by: parentId,
                approved_at: new Date().toISOString()
            }, { onConflict: 'child_id,channel_id' });
        }

        return { approved: true, channelAdded: true };
    }

    /**
     * Dismiss/delete a request
     */
    async dismissRequest(requestId: string, parentId: string): Promise<void> {
        // Verify parent owns this request
        const { data: request } = await supabaseAdmin
            .from('approval_requests')
            .select('child_id')
            .eq('id', requestId)
            .single();

        if (!request) {
            throw new AppError('Request not found', HTTP_STATUS.NOT_FOUND);
        }

        const { data: child } = await supabaseAdmin
            .from('children')
            .select('parent_id')
            .eq('id', request.child_id)
            .single();

        if (!child || child.parent_id !== parentId) {
            throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN);
        }

        await supabaseAdmin
            .from('approval_requests')
            .delete()
            .eq('id', requestId);
    }

    /**
     * Get pending count for parent
     */
    async getPendingCount(parentId: string): Promise<number> {
        const { data: children } = await supabaseAdmin
            .from('children')
            .select('id')
            .eq('parent_id', parentId);

        if (!children || children.length === 0) return 0;

        const childIds = children.map(c => c.id);

        const { count } = await supabaseAdmin
            .from('approval_requests')
            .select('*', { count: 'exact', head: true })
            .in('child_id', childIds)
            .eq('status', 'pending');

        return count || 0;
    }

    /**
     * Check if video is approved for child
     */
    async isVideoApproved(childId: string, videoId: string): Promise<boolean> {
        const { data } = await supabaseAdmin
            .from('approved_videos')
            .select('id')
            .eq('child_id', childId)
            .eq('video_id', videoId)
            .single();

        return !!data;
    }
}

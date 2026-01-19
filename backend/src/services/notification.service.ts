import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';
import { HTTP_STATUS } from '../utils/httpStatus';

export interface CreateNotificationDTO {
    parentId: string;
    childId?: string;
    type: 'screen_time_limit' | 'blocked_content' | 'channel_request' | 'unusual_activity' | 'daily_report' | 'new_child_login';
    title: string;
    message: string;
    priority?: 'low' | 'medium' | 'high';
    data?: any;
    actionUrl?: string;
}

export class NotificationService {

    /**
     * Create a notification
     */
    async create(data: CreateNotificationDTO) {
        const { error } = await supabaseAdmin
            .from('notifications')
            .insert({
                parent_id: data.parentId,
                child_id: data.childId,
                type: data.type,
                title: data.title,
                message: data.message,
                priority: data.priority || 'medium',
                data: data.data || {},
                action_url: data.actionUrl,
                is_read: false
            });

        if (error) {
            console.error('Failed to create notification', error);
            // Don't throw logic error, just log it. Notifications shouldn't break main flows.
        }
    }

    /**
     * Get notifications for parent
     */
    async getAll(parentId: string, page = 1, limit = 20) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, error, count } = await supabaseAdmin
            .from('notifications')
            .select('*', { count: 'exact' })
            .eq('parent_id', parentId)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;

        return {
            items: data,
            total: count,
            page,
            limit
        };
    }

    /**
     * Get unread count
     */
    async getUnreadCount(parentId: string) {
        const { count, error } = await supabaseAdmin
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('parent_id', parentId)
            .eq('is_read', false);

        if (error) throw error;
        return { count };
    }

    /**
     * Mark as read
     */
    async markAsRead(id: string, parentId: string) {
        const { error } = await supabaseAdmin
            .from('notifications')
            .update({ is_read: true, read_at: new Date() })
            .eq('id', id)
            .eq('parent_id', parentId);

        if (error) throw error;
        return true;
    }

    /**
     * Mark all as read
     */
    async markAllAsRead(parentId: string) {
        const { error } = await supabaseAdmin
            .from('notifications')
            .update({ is_read: true, read_at: new Date() })
            .eq('parent_id', parentId)
            .eq('is_read', false);

        if (error) throw error;
        return true;
    }

    /**
     * Delete notification
     */
    async delete(id: string, parentId: string) {
        const { error } = await supabaseAdmin
            .from('notifications')
            .delete()
            .eq('id', id)
            .eq('parent_id', parentId);

        if (error) throw error;
        return true;
    }
}

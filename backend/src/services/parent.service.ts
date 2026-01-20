import { supabaseAdmin } from '../config/supabase';
import { Parent } from '../models/types';

export class ParentService {
    /**
     * Create parent profile after Supabase Auth signup
     */
    async createParentProfile(userId: string, email: string, name: string): Promise<Parent> {
        const { data, error } = await supabaseAdmin
            .from('parents')
            .insert({
                id: userId,
                email,
                name
            })
            .select()
            .single();

        if (error) throw error;
        return data as Parent;
    }

    /**
     * Get parent profile with children
     */
    async getParentProfile(parentId: string) {
        const { data: parent, error: parentError } = await supabaseAdmin
            .from('parents')
            .select(`
        *,
        children (*)
      `)
            .eq('id', parentId)
            .single();

        if (parentError) throw parentError;
        return parent;
    }

    /**
     * Update Onboarding Step
     */
    async updateOnboardingStep(parentId: string, step: number) {
        const { error } = await supabaseAdmin
            .from('parents')
            .update({ onboarding_step: step })
            .eq('id', parentId);

        if (error) throw error;
        return true;
    }

    /**
     * Get Parent Settings
     */
    async getSettings(parentId: string) {
        const { data, error } = await supabaseAdmin
            .from('parents')
            .select('id, name, email, phone_number, notification_preferences, subscription_tier')
            .eq('id', parentId)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Update Parent Settings
     */
    async updateSettings(parentId: string, settings: {
        name?: string;
        phone_number?: string;
        notification_preferences?: {
            email?: boolean;
            push?: boolean;
            sms?: boolean;
        };
    }) {
        const updateData: any = { updated_at: new Date().toISOString() };

        if (settings.name) updateData.name = settings.name;
        if (settings.phone_number !== undefined) updateData.phone_number = settings.phone_number;
        if (settings.notification_preferences) {
            updateData.notification_preferences = settings.notification_preferences;
        }

        const { data, error } = await supabaseAdmin
            .from('parents')
            .update(updateData)
            .eq('id', parentId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Change Password (uses Supabase Auth)
     */
    async changePassword(parentId: string, newPassword: string) {
        // Use Supabase Admin to update password
        const { error } = await supabaseAdmin.auth.admin.updateUserById(parentId, {
            password: newPassword
        });

        if (error) throw error;
        return true;
    }
}


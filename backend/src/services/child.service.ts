import { supabaseAdmin } from '../config/supabase';
import bcrypt from 'bcryptjs';
import { Child } from '../models/types';
import { validatePin } from '../utils/validators';
import { PlaylistService } from './playlist.service';

export class ChildService {
    /**
     * Create a new child profile
     */
    async createChild(childData: {
        parent_id: string;
        name: string;
        age: number;
        pin: string;
        avatar?: string;
        favorite_categories?: string[];
        daily_screen_time_limit?: number;
    }): Promise<Child> {
        // Validate PIN
        const pinValidation = validatePin(childData.pin);
        if (!pinValidation.valid) {
            throw new Error(pinValidation.message);
        }

        // Hash the PIN (12 rounds)
        const pin_hash = await bcrypt.hash(childData.pin, 12);

        // Prepare preferences
        const preferences = {
            favoriteCategories: childData.favorite_categories || [],
            favoriteChannels: []
        };

        const { data: child, error } = await supabaseAdmin
            .from('children')
            .insert({
                parent_id: childData.parent_id,
                name: childData.name,
                age: childData.age,
                pin_hash,
                avatar: childData.avatar,
                preferences
                // age_appropriate_level set automatically by trigger
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // unique constraint violation
                throw new Error('This PIN is already in use for another child');
            }
            throw error;
        }

        // Create Screen Time Rules
        if (childData.daily_screen_time_limit) {
            await supabaseAdmin.from('screen_time_rules').insert({
                child_id: child.id,
                daily_limit_minutes: childData.daily_screen_time_limit
            });
        }

        // Create Default Playlists
        await PlaylistService.createDefaultPlaylists(child.id);

        return child as Child;
    }

    /**
     * Get Child by ID
     */
    async getChild(childId: string, parentId: string) {
        const { data, error } = await supabaseAdmin
            .from('children')
            .select('*')
            .eq('id', childId)
            .eq('parent_id', parentId)
            .single();

        if (error || !data) throw new Error('Child not found');
        return data as Child;
    }

    /**
     * Update Child
     */
    async updateChild(childId: string, parentId: string, updates: Partial<Child> & { daily_screen_time_limit?: number }) {
        // Verify ownership
        await this.getChild(childId, parentId);

        // Separate screen time limit
        const { daily_screen_time_limit, ...childUpdates } = updates;

        // Update Child Table
        if (Object.keys(childUpdates).length > 0) {
            const { error } = await supabaseAdmin
                .from('children')
                .update(childUpdates)
                .eq('id', childId);
            if (error) throw error;
        }

        // Update Screen Time Rules if provided
        if (daily_screen_time_limit !== undefined) {
            const { error } = await supabaseAdmin
                .from('screen_time_rules')
                .upsert({
                    child_id: childId,
                    daily_limit_minutes: daily_screen_time_limit
                }, { onConflict: 'child_id' }); // Upsert by child_id
            if (error) throw error;
        }

        return true;
    }

    /**
     * Deactivate Child (Soft Delete)
     */
    async deleteChild(childId: string, parentId: string) {
        // Verify ownership
        await this.getChild(childId, parentId);

        const { error } = await supabaseAdmin
            .from('children')
            .update({ is_active: false })
            .eq('id', childId);

        if (error) throw error;
        return true;
    }

    /**
     * Verify Child PIN
     */
    async verifyChildPin(childId: string, pin: string): Promise<boolean> {
        const { data: child, error } = await supabaseAdmin
            .from('children')
            .select('pin_hash')
            .eq('id', childId)
            .single();

        if (error) throw error;

        return await bcrypt.compare(pin, child.pin_hash);
    }

    /**
     * Get children by parent ID
     */
    async getChildren(parentId: string): Promise<Child[]> {
        const { data, error } = await supabaseAdmin
            .from('children')
            .select('*')
            .eq('parent_id', parentId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data as Child[];
    }

    /**
     * Change Child PIN
     */
    async changeChildPin(childId: string, newPin: string, parentId: string) {
        // Validate New PIN
        const pinValidation = validatePin(newPin);
        if (!pinValidation.valid) {
            throw new Error(pinValidation.message);
        }

        // Verify parent owns child
        const { data: child, error: childError } = await supabaseAdmin
            .from('children')
            .select('parent_id')
            .eq('id', childId)
            .single();

        if (childError || !child) throw new Error('Child not found');
        if (child.parent_id !== parentId) throw new Error('Unauthorized');

        const pin_hash = await bcrypt.hash(newPin, 12);

        const { error: updateError } = await supabaseAdmin
            .from('children')
            .update({ pin_hash, failed_pin_attempts: 0, lockout_until: null })
            .eq('id', childId);

        if (updateError) throw updateError;

        return true;
    }
}

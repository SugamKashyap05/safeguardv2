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
}


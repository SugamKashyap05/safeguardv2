
import { supabaseAdmin } from '../config/supabase';
import { BadgeDefinition, ChildBadge } from '../models/types';
import { socketService } from './websocket.service';

// Hardcoded Badge Definitions for Phase 1
const BADGES: Record<string, BadgeDefinition> = {
    'first_star': {
        id: 'first_star',
        name: 'First Light',
        description: 'Earned your first star!',
        icon: '🌟',
        category: 'special',
        rarity: 'common',
        condition_description: 'Earn 1 star'
    },
    'star_collector': {
        id: 'star_collector',
        name: 'Star Collector',
        description: 'Earned 100 total stars',
        icon: '✨',
        category: 'consistency',
        rarity: 'rare',
        condition_description: 'Earn 100 stars'
    }
};

export class GamificationService {

    /**
     * Award stars to a child.
     * Also checks for badges triggered by star count.
     */
    async getStats(childId: string) {
        const { data, error } = await supabaseAdmin
            .from('children')
            .select('stars, total_stars_earned')
            .eq('id', childId)
            .single();
        if (error) throw error;
        return data;
    }

    async awardStars(childId: string, amount: number, reason: string) {
        if (amount <= 0) return null;

        // 1. Get current stats
        const { data: child, error: fetchError } = await supabaseAdmin
            .from('children')
            .select('stars, total_stars_earned')
            .eq('id', childId)
            .single();

        if (fetchError || !child) throw new Error('Child not found');

        const newStars = (child.stars || 0) + amount;
        const newTotal = (child.total_stars_earned || 0) + amount;

        // 2. Update child
        const { error: updateError } = await supabaseAdmin
            .from('children')
            .update({
                stars: newStars,
                total_stars_earned: newTotal
            })
            .eq('id', childId);

        if (updateError) throw updateError;

        // 3. Check for badges
        await this.checkStarBadges(childId, newTotal);

        socketService.emitToChild(childId, 'gamification:stars_updated', {
            stars: newStars,
            total_stars_earned: newTotal
        });

        return { stars: newStars, total_stars_earned: newTotal };
    }

    /**
     * Deduct stars (redeem reward)
     */
    async spendStars(childId: string, amount: number, reason: string) {
        if (amount <= 0) return false;

        // 1. Get current stats
        const { data: child, error: fetchError } = await supabaseAdmin
            .from('children')
            .select('stars')
            .eq('id', childId)
            .single();

        if (fetchError || !child) throw new Error('Child not found');

        if ((child.stars || 0) < amount) {
            throw new Error('Not enough stars');
        }

        const newStars = child.stars - amount;

        // 2. Update child
        const { error: updateError } = await supabaseAdmin
            .from('children')
            .update({ stars: newStars })
            .eq('id', childId);

        if (updateError) throw updateError;

        socketService.emitToChild(childId, 'gamification:stars_updated', {
            stars: newStars
        });

        return { stars: newStars };
    }

    /**
     * Get all badges for a child (earned + unearned definitions)
     */
    async getBadges(childId: string) {
        // Fetch earned badges
        const { data: earnedBadges, error } = await supabaseAdmin
            .from('child_badges')
            .select('*')
            .eq('child_id', childId);

        if (error) throw error;

        // Merge with definitions
        const earnedMap = new Map();
        if (earnedBadges) {
            earnedBadges.forEach((b: any) => earnedMap.set(b.badge_id, b));
        }

        return Object.values(BADGES).map(def => ({
            ...def,
            is_earned: earnedMap.has(def.id),
            earned_at: earnedMap.get(def.id)?.earned_at || null
        }));
    }

    /**
     * Internal: Check and award star-related badges
     */
    private async checkStarBadges(childId: string, currentTotalStars: number) {
        const badgesToAward: string[] = [];

        if (currentTotalStars >= 1) badgesToAward.push('first_star');
        if (currentTotalStars >= 100) badgesToAward.push('star_collector');

        for (const badgeId of badgesToAward) {
            // Try to insert, ignore if already exists (constraint)
            // supabase doesn't have "insert ignore" easily, so we rely on ON CONFLICT DO NOTHING or checks
            // But strict unique constraint will throw error on insert.

            // Check if exists first (cleaner log)
            const { data: existing } = await supabaseAdmin
                .from('child_badges')
                .select('id')
                .eq('child_id', childId)
                .eq('badge_id', badgeId)
                .single();

            if (!existing) {
                await supabaseAdmin.from('child_badges').insert({
                    child_id: childId,
                    badge_id: badgeId,
                    metadata: { trigger: 'stars_threshold' }
                });
                console.log(`Awarded badge ${badgeId} to child ${childId}`);
                socketService.emitToChild(childId, 'gamification:badge_unlocked', {
                    badge: { ...BADGES[badgeId], is_earned: true, earned_at: new Date() }
                });
            }
        }
    }
}

export const gamificationService = new GamificationService();

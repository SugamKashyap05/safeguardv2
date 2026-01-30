
import { supabaseAdmin } from '../config/supabase';
import { gamificationService } from './gamification.service';
import { v4 as uuidv4 } from 'uuid';
import { socketService } from './websocket.service';

export interface DailyQuest {
    id: string;
    child_id: string;
    date: string;
    type: 'watch_time' | 'stars_earned' | 'videos_watched';
    target: number;
    progress: number;
    is_completed: boolean;
    reward_stars: number;
}

const QUEST_TEMPLATES = [
    { type: 'videos_watched', target: 2, reward: 5, description: 'Watch 2 videos' },
    { type: 'stars_earned', target: 10, reward: 10, description: 'Earn 10 stars' },
    { type: 'watch_time', target: 15, reward: 15, description: 'Watch for 15 minutes' }
];

export class QuestService {

    /**
     * Get quests for today. Generate if missing.
     */
    async getDailyQuests(childId: string): Promise<DailyQuest[]> {
        const today = new Date().toISOString().split('T')[0];

        // 1. Fetch existing
        const { data: existing, error } = await supabaseAdmin
            .from('daily_quests')
            .select('*')
            .eq('child_id', childId)
            .eq('date', today);

        if (error) throw error;

        if (existing && existing.length > 0) {
            return existing as DailyQuest[];
        }

        // 2. Generate new if none
        const quests = QUEST_TEMPLATES.map(template => ({
            child_id: childId,
            date: today,
            type: template.type,
            target: template.target,
            reward_stars: template.reward,
            progress: 0,
            is_completed: false
        }));

        const { data: newQuests, error: insertError } = await supabaseAdmin
            .from('daily_quests')
            .insert(quests)
            .select();

        if (insertError) throw insertError;

        return newQuests as DailyQuest[];
    }

    /**
     * Update progress for a specific action
     */
    async updateProgress(childId: string, type: string, amount: number) {
        const today = new Date().toISOString().split('T')[0];

        // Fetch active quests of this type
        const { data: quests } = await supabaseAdmin
            .from('daily_quests')
            .select('*')
            .eq('child_id', childId)
            .eq('date', today)
            .eq('type', type)
            .eq('is_completed', false);

        if (!quests || quests.length === 0) return;

        for (const quest of quests) {
            const newProgress = Math.min(quest.progress + amount, quest.target);
            const isCompleted = newProgress >= quest.target;

            // Update DB
            await supabaseAdmin
                .from('daily_quests')
                .update({
                    progress: newProgress,
                    is_completed: isCompleted
                })
                .eq('id', quest.id);

            // Award reward if just completed
            if (isCompleted) {
                await gamificationService.awardStars(childId, quest.reward_stars, `Quest Completed: ${type}`);
                socketService.emitToChild(childId, 'quest:completed', { questId: quest.id, reward: quest.reward_stars });
            }

            socketService.emitToChild(childId, 'quest:progress_updated', {
                questId: quest.id,
                progress: newProgress,
                is_completed: isCompleted
            });
        }
    }
}

export const questService = new QuestService();

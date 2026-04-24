import prisma from '../config/prisma';
import { gamificationService } from './gamification.service';
import { socketService } from './websocket.service';

interface QuestType {
    type: 'watch_time' | 'stars_earned' | 'videos_watched';
    target: number;
    reward: number;
    description: string;
}

const QUEST_TEMPLATES: QuestType[] = [
    { type: 'videos_watched', target: 2, reward: 5, description: 'Watch 2 videos' },
    { type: 'stars_earned', target: 10, reward: 10, description: 'Earn 10 stars' },
    { type: 'watch_time', target: 15, reward: 15, description: 'Watch for 15 minutes' },
];

export class QuestService {

    async getDailyQuests(childId: string) {
        // Use a proper Date object or ISO string for Prisma
        const todayStr = new Date().toISOString().split('T')[0];
        const today = new Date(todayStr); // YYYY-MM-DD at 00:00:00

        const existing = await prisma.dailyQuest.findMany({
            where: { childId, date: today },
        });
        if (existing.length > 0) return existing;

        // Generate fresh quests for today
        const created = await prisma.$transaction(
            QUEST_TEMPLATES.map(t =>
                prisma.dailyQuest.create({
                    data: {
                        childId,
                        date: today,
                        type: t.type,
                        target: t.target,
                        rewardStars: t.reward,
                        progress: 0,
                        isCompleted: false,
                    },
                }),
            ),
        );

        return created;
    }

    async updateProgress(childId: string, type: string, amount: number) {
        // Use a proper Date object for Prisma
        const todayStr = new Date().toISOString().split('T')[0];
        const today = new Date(todayStr);

        const quests = await prisma.dailyQuest.findMany({
            where: { childId, date: today, type, isCompleted: false },
        });

        if (!quests.length) return;

        for (const quest of quests) {
            const newProgress = Math.min(quest.progress + amount, quest.target);
            const isCompleted = newProgress >= quest.target;

            await prisma.dailyQuest.update({
                where: { id: quest.id },
                data: { progress: newProgress, isCompleted },
            });

            if (isCompleted) {
                await gamificationService.awardStars(childId, quest.rewardStars, `Quest Completed: ${type}`);
                socketService.emitToChild(childId, 'quest:completed', { questId: quest.id, reward: quest.rewardStars });
            }

            socketService.emitToChild(childId, 'quest:progress_updated', {
                questId: quest.id,
                progress: newProgress,
                is_completed: isCompleted,
            });
        }
    }
}

export const questService = new QuestService();

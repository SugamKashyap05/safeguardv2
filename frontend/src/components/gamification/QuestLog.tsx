
import React, { useEffect, useState } from 'react';
import { gamificationService, DailyQuest } from '../../services/gamification.service';
import { motion } from 'framer-motion';

const QUEST_DESCRIPTIONS: Record<string, string> = {
    'watch_time': 'Watch videos',
    'stars_earned': 'Earn stars',
    'videos_watched': 'Finish videos'
};

const QUEST_ICONS: Record<string, string> = {
    'watch_time': '⏱️',
    'stars_earned': '⭐',
    'videos_watched': '📺'
};

interface QuestLogProps {
    childId: string;
}

export const QuestLog: React.FC<QuestLogProps> = ({ childId }) => {
    const [quests, setQuests] = useState<DailyQuest[]>([]);

    useEffect(() => {
        const loadQuests = async () => {
            try {
                const data = await gamificationService.getDailyQuests(childId);
                setQuests(data);
            } catch (err) {
                console.error("Failed to load quests", err);
            }
        };
        loadQuests();
    }, [childId]);

    if (quests.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-indigo-100 p-6 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-100 rounded-full blur-3xl opacity-50 -mr-10 -mt-10 pointer-events-none"></div>

            <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
                <span>📜</span> Daily Missions
            </h3>

            <div className="space-y-4">
                {quests.map(quest => {
                    const progressPercent = Math.min(100, (quest.progress / quest.target) * 100);
                    const isDone = quest.is_completed;

                    // Format description
                    let desc = QUEST_DESCRIPTIONS[quest.type] || 'Complete task';
                    if (quest.type === 'watch_time') desc = `Watch ${quest.target} mins`;
                    if (quest.type === 'stars_earned') desc = `Earn ${quest.target} stars`;
                    if (quest.type === 'videos_watched') desc = `Watch ${quest.target} videos`;

                    return (
                        <div key={quest.id} className={`relative p-4 rounded-xl border-2 transition-all ${isDone ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{QUEST_ICONS[quest.type] || '🎯'}</span>
                                    <div>
                                        <div className={`font-bold ${isDone ? 'text-green-800 line-through' : 'text-gray-800'}`}>
                                            {desc}
                                        </div>
                                        <div className="text-xs font-bold text-gray-400">
                                            Reward: +{quest.reward_stars} ⭐
                                        </div>
                                    </div>
                                </div>
                                {isDone && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="bg-green-500 text-white p-1 rounded-full"
                                    >
                                        ✔️
                                    </motion.div>
                                )}
                            </div>

                            {/* Progress Bar */}
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden w-full">
                                <motion.div
                                    className={`h-full ${isDone ? 'bg-green-500' : 'bg-blue-400'}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                />
                            </div>
                            <div className="text-right text-xs font-bold text-gray-400 mt-1">
                                {quest.progress} / {quest.target}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

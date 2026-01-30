
import React from 'react';
import { motion } from 'framer-motion';

interface LevelProgressBarProps {
    totalStarsEarned: number;
}

export const LevelProgressBar: React.FC<LevelProgressBarProps> = ({ totalStarsEarned }) => {
    // Simple logic: Level = 1 + floor(stars / 100)
    // XP for current level = stars % 100
    // Target = 100

    // Example curve: Level N requires N * 50 stars total? Or flat 100 per level? 
    // Let's stick to flat 50 stars per level for Phase 1 opacity simplicity for kids.
    const STARS_PER_LEVEL = 50;

    const currentLevel = 1 + Math.floor(totalStarsEarned / STARS_PER_LEVEL);
    const progressInLevel = totalStarsEarned % STARS_PER_LEVEL;
    const percentage = (progressInLevel / STARS_PER_LEVEL) * 100;

    return (
        <div className="w-full max-w-xs bg-white rounded-2xl p-4 border border-indigo-100 shadow-sm">
            <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Level {currentLevel}</span>
                <span className="text-sm font-black text-indigo-600">{progressInLevel} / {STARS_PER_LEVEL} XP</span>
            </div>

            <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full"
                />
            </div>

            <div className="mt-2 text-center">
                <span className="text-xs font-bold text-gray-400">
                    {STARS_PER_LEVEL - progressInLevel} stars to Level {currentLevel + 1}!
                </span>
            </div>
        </div>
    );
};


import React from 'react';
import { Badge } from '../../services/gamification.service';
import { motion } from 'framer-motion';

interface BadgeShowcaseProps {
    badges: Badge[];
}

export const BadgeShowcase: React.FC<BadgeShowcaseProps> = ({ badges }) => {
    const earnedBadges = badges.filter(b => b.is_earned);
    const lockedBadges = badges.filter(b => !b.is_earned);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-indigo-100 mt-6">
            <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center">
                <span className="mr-2">🏆</span> My Achievements
            </h3>

            {/* Earned Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {earnedBadges.map(badge => (
                    <motion.div key={badge.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center p-3 bg-yellow-50 rounded-xl border border-yellow-200"
                    >
                        <div className="text-4xl mb-2">{badge.icon}</div>
                        <div className="font-bold text-sm text-yellow-900 text-center">{badge.name}</div>
                        <div className="text-xs text-yellow-700 text-center">{badge.description}</div>
                    </motion.div>
                ))}
            </div>

            {/* Locked Section */}
            {lockedBadges.length > 0 && (
                <>
                    <h4 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Next Goals</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-60 grayscale filter">
                        {lockedBadges.map(badge => (
                            <div key={badge.id} className="flex flex-col items-center p-3 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <div className="text-4xl mb-2">{badge.icon}</div>
                                <div className="font-bold text-sm text-gray-700 text-center">{badge.name}</div>
                                <div className="text-xs text-gray-500 text-center">{badge.condition_description}</div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gamificationService, Badge } from '../../services/gamification.service';
import { motion } from 'framer-motion';

export const AchievementsPage = () => {
    const navigate = useNavigate();
    const childId = localStorage.getItem('activeChildId') || ''; /** Context doesn't have childId yet */
    const [badges, setBadges] = useState<Badge[]>([]);

    useEffect(() => {
        if (childId) {
            loadBadges();
        }
    }, [childId]);

    const loadBadges = async () => {
        if (!childId) return;
        try {
            const data = await gamificationService.getBadges(childId);
            setBadges(data);
        } catch (error) {
            console.error("Failed to load badges", error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-outfit">
            <header className="bg-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-slate-600 hover:text-indigo-600 font-bold transition-colors"
                >
                    <span className="text-xl mr-2">←</span> Back
                </button>
                <h1 className="text-xl font-bold text-slate-800">My Achievements</h1>
                <div className="w-10"></div>
            </header>

            <main className="container mx-auto p-6 max-w-5xl">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {badges.map((badge) => (
                        <motion.div
                            key={badge.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`relative p-6 rounded-2xl border-2 flex flex-col items-center text-center gap-4 transition-all ${badge.is_earned
                                ? 'bg-white border-amber-200 shadow-lg shadow-amber-100'
                                : 'bg-slate-100 border-slate-200 opacity-60 grayscale'
                                }`}
                        >
                            <div className="text-6xl filter drop-shadow-md">
                                {badge.icon}
                            </div>

                            <div>
                                <h3 className={`font-bold text-lg ${badge.is_earned ? 'text-slate-800' : 'text-slate-500'}`}>
                                    {badge.name}
                                </h3>
                                <p className="text-sm text-slate-500 leading-tight mt-1">
                                    {badge.description}
                                </p>
                            </div>

                            {badge.is_earned ? (
                                <div className="absolute top-3 right-3 text-amber-500">
                                    <span className="text-xl">🏆</span>
                                </div>
                            ) : (
                                <div className="mt-2 text-xs font-bold text-slate-400 bg-slate-200 px-3 py-1 rounded-full">
                                    LOCKED
                                </div>
                            )}

                            {badge.is_earned && badge.earned_at && (
                                <div className="text-xs text-slate-400 mt-2">
                                    Earned {new Date(badge.earned_at).toLocaleDateString()}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </main>
        </div>
    );
};

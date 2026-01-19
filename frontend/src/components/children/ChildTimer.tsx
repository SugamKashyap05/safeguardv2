import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';
import { api } from '../../services/api';

export const ChildTimer = ({ childId }: { childId: string }) => {
    const [minutesLeft, setMinutesLeft] = useState<number | null>(null);
    const [warning, setWarning] = useState<string | null>(null);

    useEffect(() => {
        const checkTime = async () => {
            try {
                const res = await api.get(`/screentime/${childId}/remaining`);
                const remaining = res.data.data.minutes;
                setMinutesLeft(remaining);

                if (remaining <= 5 && remaining > 0) {
                    setWarning('Almost time to go!');
                } else if (remaining === 0) {
                    setWarning("Time's up! See you tomorrow!");
                } else {
                    setWarning(null);
                }
            } catch (err) {
                console.error(err);
            }
        };

        checkTime();
        const interval = setInterval(checkTime, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [childId]);

    if (minutesLeft === null) return null;

    return (
        <>
            {/* Always Visible Timer Pill */}
            <motion.div
                className="fixed top-4 right-4 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg z-50 text-indigo-600 font-bold"
                initial={{ y: -50 }}
                animate={{ y: 0 }}
            >
                <Clock size={16} />
                <span>{minutesLeft}m</span>
            </motion.div>

            {/* Warning Overlay */}
            <AnimatePresence>
                {warning && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 px-6 py-3 rounded-2xl shadow-xl font-bold z-50 flex items-center gap-2"
                    >
                        <span>⏰ {warning}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Time's Up Blocker */}
            {minutesLeft === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-indigo-900/95 z-[100] flex flex-col items-center justify-center text-white p-8 text-center"
                >
                    <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="text-6xl mb-4"
                    >
                        🌙
                    </motion.div>
                    <h1 className="text-4xl font-bold mb-4">Time's Up!</h1>
                    <p className="text-xl opacity-80 mb-8">You've done great today! See you tomorrow.</p>
                </motion.div>
            )}
        </>
    );
};

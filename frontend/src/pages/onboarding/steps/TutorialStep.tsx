import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Clock, PlayCircle, LayoutDashboard, ChevronRight } from 'lucide-react';

const TUTORIAL_SLIDES = [
    {
        icon: <Shield className="w-16 h-16 text-green-500" />,
        title: "AI-Powered Safety",
        desc: "We monitor content in real-time so you don't have to hover. Bad stuff gets blocked instantly."
    },
    {
        icon: <Clock className="w-16 h-16 text-blue-500" />,
        title: "Healthy Screen Time",
        desc: "Set daily limits and schedules. When time's up, the app goes to sleep (so you don't have to be the bad guy)."
    },
    {
        icon: <PlayCircle className="w-16 h-16 text-purple-500" />,
        title: "Curated Content",
        desc: "Approve specific channels or let our education experts pick the best videos for their age."
    },
    {
        icon: <LayoutDashboard className="w-16 h-16 text-orange-500" />,
        title: "Parent Dashboard",
        desc: "See exactly what they watched, for how long, and manage everything from your phone."
    }
];

export const TutorialStep = ({ onFinish }: { onFinish: () => void }) => {
    const [index, setIndex] = useState(0);

    const handleNext = () => {
        if (index < TUTORIAL_SLIDES.length - 1) {
            setIndex(index + 1);
        } else {
            onFinish();
        }
    };

    return (
        <div className="flex flex-col h-full text-center">
            <div className="flex-1 flex flex-col items-center justify-center p-4">
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center"
                    >
                        <div className="bg-gray-50 p-6 rounded-full mb-6 shadow-sm">
                            {TUTORIAL_SLIDES[index].icon}
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-3">{TUTORIAL_SLIDES[index].title}</h3>
                        <p className="text-gray-600 max-w-sm">{TUTORIAL_SLIDES[index].desc}</p>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="mt-8">
                <div className="flex justify-center gap-2 mb-6">
                    {TUTORIAL_SLIDES.map((_, i) => (
                        <div
                            key={i}
                            className={`w-2.5 h-2.5 rounded-full transition-colors ${i === index ? 'bg-yellow-400' : 'bg-gray-200'}`}
                        />
                    ))}
                </div>

                <button
                    onClick={handleNext}
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold py-4 rounded-xl shadow-lg shadow-yellow-400/30 transform transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    {index === TUTORIAL_SLIDES.length - 1 ? "Go to Dashboard" : "Next"} <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
};

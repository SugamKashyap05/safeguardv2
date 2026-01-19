import React from 'react';
import { motion } from 'framer-motion';

interface OnboardingLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
    step: number;
    totalSteps: number;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
    children,
    title,
    subtitle,
    step,
    totalSteps,
}) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-orange-50 to-yellow-200 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
                {/* Left Side: Visual/Progress */}
                <div className="bg-yellow-400 p-8 md:w-1/3 flex flex-col justify-between text-yellow-900">
                    <div>
                        <div className="flex items-center gap-2 mb-8">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm">
                                🍌
                            </div>
                            <span className="text-2xl font-bold tracking-tight">Safeguard</span>
                        </div>

                        <h1 className="text-3xl font-extrabold mb-4">{title}</h1>
                        {subtitle && <p className="text-yellow-800/80 font-medium">{subtitle}</p>}
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm font-bold opacity-80">
                            <span>Step {step} of {totalSteps}</span>
                            <span>{Math.round((step / totalSteps) * 100)}%</span>
                        </div>
                        <div className="h-3 bg-yellow-600/20 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(step / totalSteps) * 100}%` }}
                                transition={{ duration: 0.5, ease: "circOut" }}
                                className="h-full bg-white rounded-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Side: Content */}
                <div className="p-8 md:w-2/3 flex flex-col relative bg-white/50 backdrop-blur-sm">
                    {/* Background blobs for fun */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-200 rounded-bl-full opacity-20 -z-10 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-200 rounded-tr-full opacity-20 -z-10 pointer-events-none" />

                    <div className="flex-1 flex flex-col justify-center">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="w-full max-w-md mx-auto"
                        >
                            {children}
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

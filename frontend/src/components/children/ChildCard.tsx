import React from 'react';
import { motion } from 'framer-motion';
import { Edit2, Pause, Play, Clock, Activity, Settings, Youtube } from 'lucide-react';
import clsx from 'clsx';

interface ChildCardProps {
    child: any;
    onEdit: (childId: string) => void;
    onViewActivity: (childId: string) => void;
    onManageChannels: (childId: string) => void;
    onTogglePause: (child: any) => void;
}

export const ChildCard: React.FC<ChildCardProps> = ({ child, onEdit, onViewActivity, onManageChannels, onTogglePause }) => {
    const isPaused = !child.is_active || (child.paused_until && new Date(child.paused_until) > new Date());

    // Mock usage data for now
    const watchTime = Math.floor(Math.random() * 120);
    const limit = child.daily_screen_time_limit || 60;
    const usagePercent = Math.min((watchTime / limit) * 100, 100);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -5 }}
            className="bg-white rounded-3xl p-6 shadow-xl border border-yellow-100 flex flex-col relative overflow-hidden group"
        >
            {/* Status Indicator */}
            <div className={clsx("absolute top-0 left-0 w-full h-2", isPaused ? "bg-gray-200" : "bg-green-400")} />

            <div className="flex justify-between items-start mb-6">
                <div className="relative">
                    <div className="w-20 h-20 bg-yellow-50 rounded-2xl flex items-center justify-center text-4xl shadow-inner border border-yellow-100">
                        {child.avatar || '🦁'}
                    </div>
                    {isPaused && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                            <Pause size={24} className="text-gray-500" />
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    <button onClick={() => onEdit(child)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors">
                        <Edit2 size={18} />
                    </button>
                    <button onClick={() => onTogglePause(child)} className={clsx("p-2 rounded-xl transition-colors", isPaused ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-red-50 text-red-400 hover:bg-red-100")}>
                        {isPaused ? <Play size={18} /> : <Pause size={18} />}
                    </button>
                </div>
            </div>

            <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-800">{child.name}</h3>
                <p className="text-sm text-gray-500 font-medium">{child.age} Years Old • {child.age_appropriate_level || 'Explorer'}</p>
            </div>

            {/* Screen Time Progress */}
            <div className="mt-auto">
                <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                    <span className="flex items-center gap-1"><Clock size={12} /> Today</span>
                    <span>{watchTime} / {limit}m</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${usagePercent}%` }}
                        className={clsx("h-full rounded-full",
                            usagePercent > 90 ? "bg-red-400" : usagePercent > 75 ? "bg-orange-400" : "bg-green-400"
                        )}
                    />
                </div>
            </div>

            <div className="mt-4 flex gap-2">
                <button
                    onClick={() => onEdit(child)} // Using onEdit as placeholder for settings for now, or add specific prop
                    className="flex-1 py-2 flex items-center justify-center gap-2 text-sm font-bold text-indigo-500 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
                >
                    <Settings size={16} /> Regulations
                </button>
                <button
                    onClick={() => onManageChannels(child.id)}
                    className="flex-1 py-2 flex items-center justify-center gap-2 text-sm font-bold text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                >
                    <Youtube size={16} /> Channels
                </button>
                <button
                    onClick={() => onViewActivity(child.id)}
                    className="flex-1 py-2 flex items-center justify-center gap-2 text-sm font-bold text-gray-400 bg-gray-50 rounded-xl hover:bg-yellow-50 hover:text-yellow-700 transition-colors"
                >
                    <Activity size={16} /> Activity
                </button>
            </div>
        </motion.div>
    );
};

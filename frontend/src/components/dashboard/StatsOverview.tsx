import React from 'react';
import { motion } from 'framer-motion';
import { Users, Clock, PlayCircle, Star } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const StatsOverview = ({ stats, insights }: any) => {
    if (!stats) return null;

    // Simulated data for the sparkline chart
    const data = [
        { name: 'Mon', uv: 20 },
        { name: 'Tue', uv: 45 },
        { name: 'Wed', uv: 30 },
        { name: 'Thu', uv: 60 },
        { name: 'Fri', uv: 50 },
        { name: 'Sat', uv: 90 },
        { name: 'Sun', uv: 75 },
    ];

    const cards = [
        { title: 'Total Watch Time', value: `${stats.totalWatchTime}m`, icon: <Clock size={20} />, color: 'bg-blue-500' },
        { title: 'Active Children', value: stats.activeChildren, icon: <Users size={20} />, color: 'bg-green-500' },
        { title: 'Videos Today', value: stats.videosWatched, icon: <PlayCircle size={20} />, color: 'bg-purple-500' },
        { title: 'Top Category', value: stats.topCategories?.[0]?.name || 'N/A', icon: <Star size={20} />, color: 'bg-yellow-500' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {cards.map((card, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between"
                >
                    <div>
                        <p className="text-gray-500 text-sm font-medium">{card.title}</p>
                        <h3 className="text-2xl font-bold text-gray-800 mt-1">{card.value}</h3>
                    </div>
                    <div className={`p-3 rounded-xl text-white ${card.color}`}>
                        {card.icon}
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

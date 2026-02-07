import React from 'react';
// @ts-ignore
import { Trophy, Tv, Smartphone, Tablet, Monitor, Pause, Play, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
// @ts-ignore
import { motion } from 'framer-motion';
// @ts-ignore
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// --- Gamification Widget ---
export const ChampionsPodium = ({ badges = [] }: { badges: any[] }) => {
    return (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl p-6 border border-yellow-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400 opacity-10 rounded-full blur-3xl" />

            <div className="flex items-center gap-3 mb-4">
                <div className="bg-yellow-100 p-2 rounded-xl text-yellow-600">
                    <Trophy size={20} className="fill-yellow-600" />
                </div>
                <h3 className="font-bold text-gray-900">Champion's Podium</h3>
            </div>

            {badges.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto pb-2">
                    {badges.map((badge, i) => (
                        <motion.div
                            key={i}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white p-3 rounded-2xl shadow-sm border border-yellow-100 flex flex-col items-center min-w-[100px]"
                        >
                            <img src={badge.icon || "https://cdn-icons-png.flaticon.com/512/616/616490.png"} className="w-12 h-12 mb-2" alt="Badge" />
                            <span className="text-xs font-bold text-gray-800 text-center line-clamp-1">{badge.name}</span>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                    No badges earned today yet.
                </div>
            )}
        </div>
    );
};

// --- Live Status Widget ---
export const LiveStatus = ({ activity }: { activity: any }) => {
    const isOnline = activity?.status === 'online'; // Dummy status field
    const currentVideo = activity?.currentVideo;

    return (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-xl ${isOnline ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                    <Tv size={20} />
                </div>
                <h3 className="font-bold text-gray-900">Live Status</h3>
                {isOnline && (
                    <span className="bg-green-500 w-2 h-2 rounded-full animate-pulse ml-auto"></span>
                )}
            </div>

            {isOnline && currentVideo ? (
                <div className="bg-gray-50 rounded-2xl p-4 flex gap-4">
                    <img src={currentVideo.thumbnail} className="w-16 h-16 rounded-xl object-cover" />
                    <div>
                        <p className="text-xs text-green-600 font-bold mb-1">WATCHING NOW</p>
                        <h4 className="font-bold text-gray-800 line-clamp-1">{currentVideo.title}</h4>
                        <p className="text-xs text-gray-500">{currentVideo.channel}</p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                    <Monitor size={48} className="opacity-20 mb-2" />
                    <p className="text-sm">Offline</p>
                </div>
            )}
        </div>
    );
};

// --- Device Manager ---
export const DeviceManager = ({ devices = [], onTogglePause }: { devices: any[], onTogglePause: (id: string, state: boolean) => void }) => {
    const getIcon = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'mobile': return Smartphone;
            case 'tablet': return Tablet;
            default: return Monitor;
        }
    };

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 bg-gray-50/50">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Smartphone size={18} /> Connected Devices
                </h3>
            </div>

            <div className="divide-y divide-gray-50">
                {devices.map(device => {
                    const Icon = getIcon(device.device_type);
                    return (
                        <div key={device.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${device.is_paused ? 'bg-red-50 text-red-400' : 'bg-green-50 text-green-600'}`}>
                                    <Icon size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">{device.device_name}</h4>
                                    <p className="text-xs text-gray-500">
                                        Last active: {new Date(device.last_active).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => onTogglePause(device.id, !device.is_paused)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2
                                    ${device.is_paused
                                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                        : 'bg-green-100 text-green-600 hover:bg-green-200'}
                                `}
                            >
                                {device.is_paused ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}
                                {device.is_paused ? 'RESUME' : 'PAUSE'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- Charts ---
// --- Charts ---
export const UsageChart = ({ data }: { data: any[] }) => {
    // If data comes solely from API, it should have 7 entries (even if 0). 
    // If it's empty/null, it means loading or error.
    // If completely empty array passed, show empty state.

    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm h-[320px] flex flex-col items-center justify-center text-gray-400">
                <Clock size={48} className="opacity-20 mb-4" />
                <p>No activity recorded yet.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm h-[320px]">
            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Clock size={18} /> Screen Time History
            </h3>
            <ResponsiveContainer width="100%" height="80%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                        dataKey="name"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#9ca3af' }}
                    />
                    <Tooltip
                        cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '3 3' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="minutes"
                        stroke="#6366f1"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorMinutes)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

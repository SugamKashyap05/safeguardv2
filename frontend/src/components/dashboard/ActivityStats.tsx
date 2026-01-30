import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface CategoryData {
    name: string;
    value: number;
    color: string;
}

interface StatsData {
    totalMinutes: number;
    videosWatched: number;
    topCategories: CategoryData[];
    // Add other fields as needed
}

export const ActivityStats = ({ childId }: { childId: string }) => {
    const [stats, setStats] = useState<StatsData | null>(null);

    useEffect(() => {
        const loadStats = async () => {
            if (!childId) return;
            try {
                const res = await api.get(`/watch/history/${childId}/stats`);
                setStats(res.data.data); // Adjust if the API response structure is nested differently
            } catch (err) {
                console.error(err);
            }
        };
        loadStats();
    }, [childId]);

    if (!stats) return <div>Loading Stats...</div>;

    const data = stats.topCategories || [];
    const colors = ['#F59E0B', '#3B82F6', '#10B981', '#EC4899', '#8B5CF6'];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Summary Cards */}
            <div className="col-span-full grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-6 rounded-2xl text-center">
                    <h3 className="text-3xl font-black text-blue-600">{stats.totalMinutes}m</h3>
                    <p className="text-sm font-bold text-blue-400 uppercase tracking-widest mt-1">Total Time</p>
                </div>
                <div className="bg-green-50 p-6 rounded-2xl text-center">
                    <h3 className="text-3xl font-black text-green-600">{stats.videosWatched}</h3>
                    <p className="text-sm font-bold text-green-400 uppercase tracking-widest mt-1">Videos</p>
                </div>
            </div>

            {/* Charts */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 h-80">
                <h3 className="text-lg font-bold text-gray-800 mb-6">Top Categories</h3>
                <ResponsiveContainer width="100%" height="80%">
                    <BarChart data={data}>
                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis hide />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}> {/* Ensure 'value' is the correct key from API */}
                            {data.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-yellow-50 rounded-2xl p-6 border border-yellow-100 flex items-center justify-center text-center">
                <div>
                    <h3 className="text-xl font-bold text-yellow-800">Insights</h3>
                    <p className="text-yellow-700 mt-2">
                        Your child loves <strong>{data[0]?.name || 'Videos'}</strong>! <br />
                        Mostly active during <strong>Afternoons</strong>.
                    </p>
                </div>
            </div>
        </div>
    );
};

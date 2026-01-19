import { useState, useEffect } from 'react';
import { api } from '../../services/api';

import { StatsOverview } from '../../components/dashboard/StatsOverview';
import { ActivityFeed } from '../../components/dashboard/ActivityFeed';
import { NotificationBell } from '../../components/dashboard/NotificationBell';
// @ts-ignore
import { ChildManagementPage } from './ChildManagementPage'; // We can reuse grid or just link to it
import { PlusCircle, Shield, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ParentDashboardPage = () => {
    const navigate = useNavigate(); // Assuming react-router
    const [stats, setStats] = useState(null);
    const [activity, setActivity] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, activityRes] = await Promise.all([
                api.get('/parents/dashboard/stats'), // Updated path
                api.get('/parents/dashboard/activity')
            ]);
            setStats(statsRes.data.data);
            setActivity(activityRes.data.data);
        } catch (err) {
            console.error('Failed to load dashboard', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading Dashboard...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Parent Dashboard</h1>
                    <p className="text-gray-500">Overview of your family's digital safety</p>
                </div>
                <div className="flex gap-3">
                    <NotificationBell />
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                        <Settings size={18} /> Settings
                    </button>
                    <button onClick={() => navigate('/dashboard/children')} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 shadow-sm shadow-indigo-200">
                        <PlusCircle size={18} /> Manage Children
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <StatsOverview stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
                {/* Main Content Area - Insights / Charts (Placeholder for now, using dummy chart in Overview or here) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Insights Widget: Top Categories Chart using Recharts */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80">
                        <h3 className="text-lg font-bold text-gray-800 mb-6">Top Categories Watched</h3>
                        {/* We can insert a Recharts BarChart here later */}
                        <div className="h-full flex items-center justify-center text-gray-400 border-2 dashed border-gray-100 rounded-xl">
                            Chart Visualization Coming Soon
                        </div>
                    </div>

                    {/* Quick Access Blocked Content Review */}
                    <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                                <Shield size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Safety Alerts</h3>
                                <p className="text-gray-600 text-sm mt-1 mb-4">You have {activity?.flaggedContent?.length || 0} flagged content attempts requiring review.</p>
                                {activity?.flaggedContent?.length > 0 && (
                                    <button className="text-sm font-bold text-red-600 hover:underline">Review Alerts &rarr;</button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar - Activity Feed */}
                <div className="lg:col-span-1 h-full">
                    <ActivityFeed activity={activity} />
                </div>
            </div>
        </div>
    );
};

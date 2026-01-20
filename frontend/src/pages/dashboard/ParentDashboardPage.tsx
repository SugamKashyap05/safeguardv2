import { useState, useEffect } from 'react';
import { api } from '../../services/api';

import { StatsOverview } from '../../components/dashboard/StatsOverview';
import { ActivityFeed } from '../../components/dashboard/ActivityFeed';
import { NotificationBell } from '../../components/dashboard/NotificationBell';
// @ts-ignore
import { ChildManagementPage } from './ChildManagementPage'; // We can reuse grid or just link to it
import { PlusCircle, Shield, Settings, FileText, AlertOctagon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ParentDashboardPage = () => {
    const navigate = useNavigate(); // Assuming react-router
    const [stats, setStats] = useState(null);
    const [activity, setActivity] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [pausingAll, setPausingAll] = useState(false);

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

    const handlePauseAll = async () => {
        if (!confirm('Pause ALL children immediately? They will not be able to watch any content.')) return;
        setPausingAll(true);
        try {
            await api.post('/emergency/panic-pause');
            alert('All children have been paused!');
            fetchDashboardData();
        } catch (err) {
            console.error('Failed to pause all', err);
            alert('Failed to pause all children');
        } finally {
            setPausingAll(false);
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
                    <button
                        onClick={handlePauseAll}
                        disabled={pausingAll}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                    >
                        <AlertOctagon size={18} /> {pausingAll ? 'Pausing...' : 'Pause All'}
                    </button>
                    <button onClick={() => navigate('/parent/reports')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                        <FileText size={18} /> Reports
                    </button>
                    <button onClick={() => navigate('/parent/settings')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                        <Settings size={18} /> Settings
                    </button>
                    <button onClick={() => navigate('/parent/children')} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 shadow-sm shadow-indigo-200">
                        <PlusCircle size={18} /> Manage Children
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <StatsOverview stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
                {/* Main Content Area - Insights / Charts (Placeholder for now, using dummy chart in Overview or here) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Insights Widget: Watch Time Summary */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80">
                        <h3 className="text-lg font-bold text-gray-800 mb-6">Today's Activity</h3>
                        {activity?.children?.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4 h-full pb-8">
                                {activity.children.slice(0, 4).map((child: any, idx: number) => (
                                    <div key={child.childId || idx} className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex flex-col justify-between">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                                {child.childName?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">{child.childName || 'Child'}</p>
                                                <p className="text-xs text-gray-500">{child.status || 'Active'}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-600">Screen Time</span>
                                                <span className="font-bold text-indigo-600">{child.todayMinutes || 0}m / {child.limitMinutes || 60}m</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
                                                    style={{ width: `${Math.min(100, ((child.todayMinutes || 0) / (child.limitMinutes || 60)) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">
                                No activity data yet. Add children to get started!
                            </div>
                        )}
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

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
// @ts-ignore
import { LayoutGrid, ListPlus, Trash2, Edit2, PlaySquare, Plus, Bell, Shield, Settings, FileText, AlertOctagon, Inbox, Play, ChevronDown } from 'lucide-react';
// @ts-ignore
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { NotificationBell } from '../../components/dashboard/NotificationBell';
// @ts-ignore
import { ChampionsPodium, LiveStatus, DeviceManager, UsageChart } from '../../components/dashboard/DashboardWidgets';

export const ParentDashboardPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [activity, setActivity] = useState<any>(null);
    const [devices, setDevices] = useState<any[]>([]); // Device List
    const [selectedChildId, setSelectedChildId] = useState<string | null>(null); // For charts/devices
    const [pausingAll, setPausingAll] = useState(false);

    const loadData = async () => {
        try {
            const [statsRes, activityRes] = await Promise.all([
                api.get('/parents/dashboard/stats'),
                api.get('/parents/dashboard/activity')
            ]);
            setStats(statsRes.data.data);
            setActivity(activityRes.data.data);

            // Auto-select first child for detailed view
            const firstChild = activityRes.data.data.children?.[0]?.childId;
            if (firstChild && !selectedChildId) {
                setSelectedChildId(firstChild);
                loadDevices(firstChild);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadDevices = async (childId: string) => {
        try {
            const res = await api.get(`/devices/${childId}`);
            setDevices(res.data.data);
        } catch (err) {
            console.error("Failed to load devices", err);
        }
    };

    const toggleDevice = async (deviceId: string, isPaused: boolean) => {
        try {
            // Optimistic update
            setDevices(prev => prev.map(d => d.id === deviceId ? { ...d, is_paused: isPaused } : d));

            await api.post(`/devices/${deviceId}/pause`, { childId: selectedChildId, isPaused });
        } catch (err) {
            alert('Failed to update device status');
            loadDevices(selectedChildId!); // Revert
        }
    };

    const handlePauseAll = async () => {
        if (!confirm('Pause EVERYTHING?')) return;
        setPausingAll(true);
        try {
            await api.post('/emergency/panic-pause');
            // Reload devices to show paused state? 
            // Panic pause assumes global lock, device pause might be separate. 
            // Keeping existing logic for now.
        } catch (err) { console.error(err); }
        finally { setPausingAll(false); }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedChildId) loadDevices(selectedChildId);
    }, [selectedChildId]);

    if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>;

    const currentChild = activity?.children?.find((c: any) => c.childId === selectedChildId) || activity?.children?.[0];

    return (
        <div className="min-h-screen bg-[#FDFDFD] p-6 lg:p-10 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* --- Header --- */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Parent Dashboard</h1>
                        <p className="text-gray-500 font-medium mt-1">
                            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <NotificationBell />

                        {/* Quick Pause All - EMERGENCY BUTTON */}
                        <button
                            onClick={handlePauseAll}
                            disabled={pausingAll}
                            className={`
                                group relative px-6 py-3 rounded-2xl font-bold flex items-center gap-3 transition-all duration-300 shadow-lg hover:shadow-red-200
                                ${pausingAll ? 'bg-gray-100 text-gray-400' : 'bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 hover:-translate-y-1'}
                            `}
                        >
                            <div className="bg-red-100 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                                <AlertOctagon size={18} />
                            </div>
                            {pausingAll ? 'Processing...' : 'PAUSE ALL'}
                        </button>

                        <button onClick={() => navigate('/parent/settings')} className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                            <Settings size={20} className="text-gray-600" />
                        </button>
                    </div>
                </header>

                {/* --- Main Grid --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Detailed Insights & Control */}
                    <div className="space-y-8 lg:col-span-2">

                        {/* Quick Child Selector Tabs if multiple */}
                        {activity?.children?.length > 1 && (
                            <div className="flex gap-2 pb-2 overflow-x-auto">
                                {activity.children.map((child: any) => (
                                    <button
                                        key={child.childId}
                                        onClick={() => setSelectedChildId(child.childId)}
                                        className={`px-5 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap
                                            ${selectedChildId === child.childId
                                                ? 'bg-gray-900 text-white shadow-lg shadow-gray-200'
                                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}
                                        `}
                                    >
                                        {child.childName}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Champions Podium */}
                            <div className="md:col-span-2">
                                <ChampionsPodium badges={activity?.recentBadges || []} />
                            </div>

                            {/* Live Status */}
                            <LiveStatus activity={currentChild} />
                        </div>

                        {/* Charts Area */}
                        <div className="grid grid-cols-1 gap-6">
                            <UsageChart data={activity?.weeklyHistory || []} />
                        </div>

                        {/* Recent Alerts / Quick Actions */}
                        <div className="bg-red-50 rounded-3xl p-6 border border-red-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="bg-white p-3 rounded-2xl shadow-sm text-red-500">
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Safety Check</h3>
                                    <p className="text-sm text-gray-600">3 flagged videos attempted this week.</p>
                                </div>
                            </div>
                            <button className="px-5 py-2.5 bg-white text-red-600 font-bold rounded-xl shadow-sm hover:shadow-md transition-all text-sm">
                                Review Activity
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Sidebar */}
                    <div className="space-y-8">
                        {/* Device Manager */}
                        {selectedChildId && <DeviceManager devices={devices} onTogglePause={toggleDevice} />}

                        {/* Navigation Links */}
                        <div className="space-y-4">
                            {[
                                { label: 'Rules & Limits', icon: Settings, path: '/parent/children' },
                                { label: 'Content Channels', icon: ListPlus, path: `/parent/channels/${selectedChildId}` },
                                { label: 'Playlists', icon: PlaySquare, path: `/parent/playlists/${selectedChildId}` },
                                { label: 'Activity Reports', icon: FileText, path: '/parent/reports' },
                                { label: 'Approvals', icon: Inbox, path: '/parent/approvals', badge: 0 },
                            ].map((item, i) => (
                                <button
                                    key={i}
                                    onClick={() => navigate(item.path)}
                                    className="w-full bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl group-hover:bg-indigo-100 transition-colors">
                                            <item.icon size={20} />
                                        </div>
                                        <span className="font-bold text-gray-700">{item.label}</span>
                                    </div>
                                    <div className="text-gray-300">
                                        <ChevronDown className="-rotate-90" size={18} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

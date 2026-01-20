import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChildControlsService, ScreenTimeRules } from '../../services/child-controls.service';
import { ArrowLeft, Clock, Shield, Moon, Play, Pause, Plus, Save, AlertCircle, CheckCircle, User } from 'lucide-react';
import clsx from 'clsx';

export const ManageChildPage = () => {
    const { childId } = useParams<{ childId: string }>();
    const navigate = useNavigate();

    const [child, setChild] = useState<any>(null);
    const [rules, setRules] = useState<ScreenTimeRules | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (childId) loadData(childId);
    }, [childId]);

    const loadData = async (id: string) => {
        try {
            const [childData, rulesData] = await Promise.all([
                ChildControlsService.getChild(id),
                ChildControlsService.getScreenTimeRules(id)
            ]);
            setChild(childData);
            setRules(rulesData);
            setIsPaused(childData.paused_until && new Date(childData.paused_until) > new Date());
        } catch (err) {
            console.error('Failed to load data', err);
            setMessage({ type: 'error', text: 'Failed to load child data' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!childId || !rules) return;
        setIsSaving(true);
        setMessage(null);

        try {
            await ChildControlsService.updateScreenTimeRules(childId, rules);
            setMessage({ type: 'success', text: 'Settings saved successfully!' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to save settings' });
        } finally {
            setIsSaving(false);
        }
    };

    const handlePauseToggle = async () => {
        if (!childId) return;
        try {
            if (isPaused) {
                await ChildControlsService.resumeChild(childId);
            } else {
                await ChildControlsService.pauseChild(childId);
            }
            setIsPaused(!isPaused);
            setMessage({ type: 'success', text: isPaused ? 'Access resumed' : 'Access paused' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to update pause status' });
        }
    };

    const handleExtendTime = async (minutes: number) => {
        if (!childId) return;
        try {
            await ChildControlsService.extendTime(childId, minutes);
            setMessage({ type: 'success', text: `Added ${minutes} minutes` });
            // Reload rules to update usage display
            const updatedRules = await ChildControlsService.getScreenTimeRules(childId);
            setRules(updatedRules);
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to extend time' });
        }
    };

    if (isLoading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/parent/children')} className="p-2 hover:bg-gray-100 rounded-lg">
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                {child?.avatar || child?.name?.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">{child?.name || 'Child'}</h1>
                                <p className="text-sm text-gray-500">Age {child?.age}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handlePauseToggle}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                                isPaused ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"
                            )}
                        >
                            {isPaused ? <Play size={18} /> : <Pause size={18} />}
                            {isPaused ? 'Resume' : 'Pause'}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            <Save size={18} />
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className="max-w-4xl mx-auto mt-4 px-4">
                    <div className={clsx(
                        "flex items-center gap-3 p-4 rounded-lg",
                        message.type === 'success' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    )}>
                        {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        {message.text}
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto p-4 space-y-6">
                {/* Screen Time Section */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <Clock size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Screen Time</h2>
                    </div>

                    {/* Usage Today */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-gray-700">Today's Usage</span>
                            <span className="font-bold text-indigo-600">
                                {rules?.today_usage_minutes || 0} / {rules?.daily_limit_minutes || 60} min
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all"
                                style={{ width: `${Math.min(100, ((rules?.today_usage_minutes || 0) / (rules?.daily_limit_minutes || 60)) * 100)}%` }}
                            />
                        </div>
                        <div className="flex gap-2 mt-4">
                            {[15, 30, 60].map(mins => (
                                <button
                                    key={mins}
                                    onClick={() => handleExtendTime(mins)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"
                                >
                                    <Plus size={14} /> {mins}m
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Daily Limits */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Daily Limit</label>
                            <div className="flex items-center">
                                <input
                                    type="number"
                                    value={rules?.daily_limit_minutes || 60}
                                    onChange={(e) => setRules(r => r ? { ...r, daily_limit_minutes: parseInt(e.target.value) || 60 } : null)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                                />
                                <span className="ml-2 text-gray-500">min</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Weekday Limit</label>
                            <div className="flex items-center">
                                <input
                                    type="number"
                                    value={rules?.weekday_limit_minutes || ''}
                                    onChange={(e) => setRules(r => r ? { ...r, weekday_limit_minutes: parseInt(e.target.value) || undefined } : null)}
                                    placeholder="Same as daily"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                                />
                                <span className="ml-2 text-gray-500">min</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Weekend Limit</label>
                            <div className="flex items-center">
                                <input
                                    type="number"
                                    value={rules?.weekend_limit_minutes || ''}
                                    onChange={(e) => setRules(r => r ? { ...r, weekend_limit_minutes: parseInt(e.target.value) || undefined } : null)}
                                    placeholder="Same as daily"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                                />
                                <span className="ml-2 text-gray-500">min</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Bedtime Mode */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                <Moon size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Bedtime Mode</h2>
                                <p className="text-sm text-gray-500">Block access during sleep hours</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setRules(r => r ? {
                                ...r,
                                bedtime_mode: { ...r.bedtime_mode, enabled: !r.bedtime_mode.enabled }
                            } : null)}
                            className={clsx(
                                "w-14 h-8 rounded-full transition-colors relative",
                                rules?.bedtime_mode?.enabled ? "bg-purple-600" : "bg-gray-300"
                            )}
                        >
                            <span className={clsx(
                                "absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform",
                                rules?.bedtime_mode?.enabled ? "right-1" : "left-1"
                            )} />
                        </button>
                    </div>

                    {rules?.bedtime_mode?.enabled && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bedtime Starts</label>
                                <input
                                    type="time"
                                    value={rules?.bedtime_mode?.startTime || '20:00'}
                                    onChange={(e) => setRules(r => r ? {
                                        ...r,
                                        bedtime_mode: { ...r.bedtime_mode, startTime: e.target.value }
                                    } : null)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bedtime Ends</label>
                                <input
                                    type="time"
                                    value={rules?.bedtime_mode?.endTime || '07:00'}
                                    onChange={(e) => setRules(r => r ? {
                                        ...r,
                                        bedtime_mode: { ...r.bedtime_mode, endTime: e.target.value }
                                    } : null)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
                                />
                            </div>
                        </div>
                    )}
                </section>

                {/* Break Reminders */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                                <Shield size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Break Reminders</h2>
                                <p className="text-sm text-gray-500">Remind child to take breaks</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setRules(r => r ? { ...r, break_reminder_enabled: !r.break_reminder_enabled } : null)}
                            className={clsx(
                                "w-14 h-8 rounded-full transition-colors relative",
                                rules?.break_reminder_enabled ? "bg-amber-500" : "bg-gray-300"
                            )}
                        >
                            <span className={clsx(
                                "absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform",
                                rules?.break_reminder_enabled ? "right-1" : "left-1"
                            )} />
                        </button>
                    </div>

                    {rules?.break_reminder_enabled && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reminder Interval</label>
                            <select
                                value={rules?.break_reminder_interval || 30}
                                onChange={(e) => setRules(r => r ? { ...r, break_reminder_interval: parseInt(e.target.value) } : null)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none"
                            >
                                <option value={15}>Every 15 minutes</option>
                                <option value={30}>Every 30 minutes</option>
                                <option value={45}>Every 45 minutes</option>
                                <option value={60}>Every 60 minutes</option>
                            </select>
                        </div>
                    )}
                </section>

                {/* Content Filters Section */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                            <Shield size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Content Filters</h2>
                            <p className="text-sm text-gray-500">Control what content your child can access</p>
                        </div>
                    </div>

                    {/* Age Restriction */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Age Restriction Level</label>
                        <select
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none"
                            defaultValue={child?.age <= 5 ? 'preschool' : child?.age <= 8 ? 'kids' : child?.age <= 12 ? 'tweens' : 'teens'}
                        >
                            <option value="preschool">Preschool (0-5 years) - Most restrictive</option>
                            <option value="kids">Kids (6-8 years) - Kid-friendly only</option>
                            <option value="tweens">Tweens (9-12 years) - Moderate filtering</option>
                            <option value="teens">Teens (13+ years) - Light filtering</option>
                        </select>
                    </div>

                    {/* Content Categories to Block */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">Blocked Categories</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {[
                                { id: 'gaming', label: '🎮 Gaming', desc: 'Video game content' },
                                { id: 'music', label: '🎵 Music Videos', desc: 'Music videos' },
                                { id: 'challenges', label: '⚠️ Challenges', desc: 'Viral challenges' },
                                { id: 'unboxing', label: '📦 Unboxing', desc: 'Product unboxing' },
                                { id: 'asmr', label: '🔊 ASMR', desc: 'ASMR content' },
                                { id: 'livestream', label: '🔴 Livestreams', desc: 'Live content' }
                            ].map(cat => (
                                <label
                                    key={cat.id}
                                    className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:border-red-300 hover:bg-red-50 transition-colors"
                                >
                                    <input type="checkbox" className="mt-1 w-4 h-4 text-red-600 rounded" />
                                    <div>
                                        <span className="font-medium text-gray-800">{cat.label}</span>
                                        <p className="text-xs text-gray-500">{cat.desc}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Safe Search */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                            <h3 className="font-bold text-gray-800">Safe Search</h3>
                            <p className="text-sm text-gray-500">Enforce safe search on all queries</p>
                        </div>
                        <button
                            className="w-14 h-8 rounded-full transition-colors relative bg-green-500"
                            disabled
                        >
                            <span className="absolute top-1 right-1 w-6 h-6 bg-white rounded-full shadow" />
                        </button>
                    </div>
                </section>

                {/* Quick Links */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                        onClick={() => navigate(`/parent/channels/${childId}`)}
                        className="p-4 bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all flex items-center gap-4"
                    >
                        <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                            <Shield size={24} />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-gray-900">Channels</p>
                            <p className="text-sm text-gray-500">Manage</p>
                        </div>
                    </button>
                    <button
                        onClick={() => navigate(`/parent/child/${childId}/playlists`)}
                        className="p-4 bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all flex items-center gap-4"
                    >
                        <div className="p-3 bg-pink-100 text-pink-600 rounded-xl">
                            <User size={24} />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-gray-900">Playlists</p>
                            <p className="text-sm text-gray-500">View</p>
                        </div>
                    </button>
                    <button
                        onClick={() => navigate(`/parent/activity/${childId}`)}
                        className="p-4 bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all flex items-center gap-4"
                    >
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                            <Clock size={24} />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-gray-900">Activity</p>
                            <p className="text-sm text-gray-500">History</p>
                        </div>
                    </button>
                    <button
                        onClick={() => navigate('/parent/reports')}
                        className="p-4 bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all flex items-center gap-4"
                    >
                        <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                            <AlertCircle size={24} />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-gray-900">Reports</p>
                            <p className="text-sm text-gray-500">Weekly</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

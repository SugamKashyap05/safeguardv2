import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, Moon, Coffee, Save } from 'lucide-react';
import { api } from '../../services/api';

export const ScreenTimeSettings = ({ childId }: { childId: string }) => {
    const [rules, setRules] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadRules();
    }, [childId]);

    const loadRules = async () => {
        try {
            const res = await api.get(`/screentime/${childId}`);
            setRules(res.data.data);
        } catch (err) {
            console.error('Failed to load rules', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/screentime/${childId}`, rules);
            // Show toast success
        } catch (err) {
            console.error('Failed to save', err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading Settings...</div>;
    if (!rules) return <div>No rules found</div>;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
            <div className="flex justify-between items-center border-b pb-6">
                <h2 className="text-xl font-bold text-gray-900">Screen Time Controls</h2>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                    <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* Daily Limits */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-800 font-semibold">
                    <Clock className="text-blue-500" /> Daily Limits
                </div>
                <div className="bg-gray-50 p-6 rounded-xl space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                            Base Daily Limit: <span className="text-indigo-600 font-bold">{rules.daily_limit_minutes} mins</span>
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="180"
                            step="15"
                            value={rules.daily_limit_minutes || 60}
                            onChange={(e) => setRules({ ...rules, daily_limit_minutes: parseInt(e.target.value) })}
                            className="w-full accent-indigo-600"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>0m</span>
                            <span>3h</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bedtime Mode */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-800 font-semibold">
                    <Moon className="text-purple-500" /> Bedtime Mode
                </div>
                <div className="bg-gray-50 p-6 rounded-xl flex items-center justify-between">
                    <div>
                        <p className="font-medium text-gray-900">Enable Bedtime</p>
                        <p className="text-sm text-gray-500">Automatically locks device at night</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={rules.bedtime_mode?.enabled}
                            onChange={(e) => setRules({
                                ...rules,
                                bedtime_mode: { ...rules.bedtime_mode, enabled: e.target.checked }
                            })}
                            className="w-5 h-5 accent-purple-600 rounded"
                        />
                    </div>
                </div>
                {rules.bedtime_mode?.enabled && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-gray-600">Start Time</label>
                            <input
                                type="time"
                                value={rules.bedtime_mode?.startTime || '20:00'}
                                onChange={(e) => setRules({
                                    ...rules,
                                    bedtime_mode: { ...rules.bedtime_mode, startTime: e.target.value }
                                })}
                                className="w-full mt-1 p-2 border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-600">End Time</label>
                            <input
                                type="time"
                                value={rules.bedtime_mode?.endTime || '07:00'}
                                onChange={(e) => setRules({
                                    ...rules,
                                    bedtime_mode: { ...rules.bedtime_mode, endTime: e.target.value }
                                })}
                                className="w-full mt-1 p-2 border rounded-lg"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Break Reminders */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-800 font-semibold">
                    <Coffee className="text-orange-500" /> Take a Break
                </div>
                <div className="bg-gray-50 p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                        <p className="font-medium text-gray-900">Break Reminders</p>
                        <input
                            type="checkbox"
                            checked={rules.break_reminder_enabled}
                            onChange={(e) => setRules({
                                ...rules,
                                break_reminder_enabled: e.target.checked
                            })}
                            className="w-5 h-5 accent-orange-600 rounded"
                        />
                    </div>
                    {rules.break_reminder_enabled && (
                        <div>
                            <label className="text-sm text-gray-600">
                                Remind every <span className="font-bold">{rules.break_reminder_interval} mins</span>
                            </label>
                            <input
                                type="range"
                                min="15"
                                max="60"
                                step="5"
                                value={rules.break_reminder_interval || 30}
                                onChange={(e) => setRules({ ...rules, break_reminder_interval: parseInt(e.target.value) })}
                                className="w-full accent-orange-500 mt-2"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ParentService, ParentSettings } from '../../services/parent.service';
import { ArrowLeft, User, Bell, Lock, CreditCard, Save, AlertCircle, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

export const ParentSettingsPage = () => {
    const navigate = useNavigate();
    const [settings, setSettings] = useState<ParentSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Password change state
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await ParentService.getSettings();
            setSettings(data);
        } catch (err) {
            console.error('Failed to load settings', err);
            setMessage({ type: 'error', text: 'Failed to load settings' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        if (!settings) return;
        setIsSaving(true);
        setMessage(null);

        try {
            const updated = await ParentService.updateSettings({
                name: settings.name,
                phone_number: settings.phone_number,
                notification_preferences: settings.notification_preferences
            });
            setSettings(updated);
            setMessage({ type: 'success', text: 'Settings saved successfully!' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to save settings' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async () => {
        setPasswordError('');

        if (newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }

        try {
            await ParentService.changePassword(newPassword);
            setNewPassword('');
            setConfirmPassword('');
            setMessage({ type: 'success', text: 'Password changed successfully!' });
        } catch (err) {
            setPasswordError('Failed to change password');
        }
    };

    const toggleNotification = (key: 'email' | 'push' | 'sms') => {
        if (!settings) return;
        setSettings({
            ...settings,
            notification_preferences: {
                ...settings.notification_preferences,
                [key]: !settings.notification_preferences[key]
            }
        });
    };

    if (isLoading) return <div className="p-8 text-center">Loading Settings...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/parent/dashboard')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
                    </div>
                    <button
                        onClick={handleSaveSettings}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        <Save size={18} />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Message Toast */}
            {message && (
                <div className={clsx(
                    "max-w-4xl mx-auto mt-4 px-4",
                )}>
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
                {/* Profile Section */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <User size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Profile</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                value={settings?.name || ''}
                                onChange={(e) => setSettings(s => s ? { ...s, name: e.target.value } : null)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={settings?.email || ''}
                                disabled
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <input
                                type="tel"
                                value={settings?.phone_number || ''}
                                onChange={(e) => setSettings(s => s ? { ...s, phone_number: e.target.value } : null)}
                                placeholder="+1 (555) 123-4567"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                            />
                        </div>
                    </div>
                </section>

                {/* Notifications Section */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                            <Bell size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
                    </div>

                    <div className="space-y-4">
                        {[
                            { key: 'email' as const, label: 'Email Notifications', description: 'Receive updates via email' },
                            { key: 'push' as const, label: 'Push Notifications', description: 'Browser and app notifications' },
                            { key: 'sms' as const, label: 'SMS Notifications', description: 'Text message alerts' },
                        ].map(({ key, label, description }) => (
                            <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="font-medium text-gray-900">{label}</p>
                                    <p className="text-sm text-gray-500">{description}</p>
                                </div>
                                <button
                                    onClick={() => toggleNotification(key)}
                                    className={clsx(
                                        "w-14 h-8 rounded-full transition-colors relative",
                                        settings?.notification_preferences?.[key] ? "bg-indigo-600" : "bg-gray-300"
                                    )}
                                >
                                    <span
                                        className={clsx(
                                            "absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform",
                                            settings?.notification_preferences?.[key] ? "right-1" : "left-1"
                                        )}
                                    />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Security Section */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                            <Lock size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Security</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                            />
                        </div>
                    </div>
                    {passwordError && (
                        <p className="text-red-500 text-sm mt-2">{passwordError}</p>
                    )}
                    <button
                        onClick={handleChangePassword}
                        className="mt-4 px-6 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-colors"
                    >
                        Change Password
                    </button>
                </section>

                {/* Subscription Section */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                            <CreditCard size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Subscription</h2>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
                        <div>
                            <p className="font-bold text-gray-900 capitalize">{settings?.subscription_tier || 'Free'} Plan</p>
                            <p className="text-sm text-gray-500">
                                {settings?.subscription_tier === 'free'
                                    ? 'Upgrade for more features'
                                    : 'Thank you for supporting us!'}
                            </p>
                        </div>
                        {settings?.subscription_tier === 'free' && (
                            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">
                                Upgrade
                            </button>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

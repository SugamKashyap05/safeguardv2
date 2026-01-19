import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Trash2, AlertTriangle, Info, Shield, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';

export const NotificationCenterPage = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const res = await api.get('/notifications?limit=50');
            setNotifications(res.data.data.items || []);
        } catch (error) {
            console.error('Failed to load notifications', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.patch('/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (e) {
            console.error(e);
        }
    };

    const handleMarkRead = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    const getIcon = (type: string, priority: string) => {
        if (priority === 'high') return <AlertTriangle className="text-red-500" />;
        if (type === 'approval_request') return <Shield className="text-blue-500" />;
        return <Info className="text-gray-500" />;
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.is_read;
        if (filter === 'high') return n.priority === 'high';
        return true;
    });

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-end">
                    <div>
                        <button
                            onClick={() => navigate('/parent/dashboard')}
                            className="text-gray-500 hover:text-gray-700 font-bold mb-2 flex items-center gap-2"
                        >
                            &larr; Back to Dashboard
                        </button>
                        <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                            <Bell className="fill-yellow-400 text-yellow-600" size={32} />
                            Notification Center
                        </h1>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleMarkAllRead}
                            className="px-4 py-2 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
                        >
                            <CheckCircle size={18} />
                            Mark all read
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex gap-2 w-full sm:w-auto overflow-x-auto">
                    {['all', 'unread', 'high'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-6 py-2 rounded-xl font-bold capitalize transition-all ${filter === f
                                ? 'bg-gray-900 text-white shadow-md'
                                : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="space-y-4">
                    <AnimatePresence>
                        {loading ? (
                            <div className="text-center py-12 text-gray-400 font-medium">Loading notifications...</div>
                        ) : filteredNotifications.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                    <Bell size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">All caught up!</h3>
                                <p className="text-gray-500 mt-2">No notifications to display.</p>
                            </div>
                        ) : (
                            filteredNotifications.map(notification => (
                                <motion.div
                                    key={notification.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`group relative bg-white p-6 rounded-2xl border transition-all hover:shadow-md cursor-pointer
                                        ${!notification.is_read ? 'border-blue-200 shadow-sm bg-blue-50/10' : 'border-gray-100'}
                                    `}
                                    onClick={() => {
                                        if (!notification.is_read) handleMarkRead(notification.id);
                                        if (notification.action_url) navigate(notification.action_url);
                                    }}
                                >
                                    <div className="flex gap-4 items-start">
                                        <div className={`p-3 rounded-xl shrink-0 ${notification.priority === 'high' ? 'bg-red-100' : 'bg-gray-100'
                                            }`}>
                                            {getIcon(notification.type, notification.priority)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h3 className={`text-lg mb-1 truncate pr-8 ${!notification.is_read ? 'font-black text-gray-900' : 'font-bold text-gray-600'}`}>
                                                    {notification.title}
                                                </h3>
                                                <span className="text-xs font-bold text-gray-400 shrink-0">
                                                    {new Date(notification.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-gray-600 leading-relaxed mb-3">
                                                {notification.message}
                                            </p>

                                            {/* Actions */}
                                            <div className="flex gap-3">
                                                {notification.action_url && (
                                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg group-hover:bg-indigo-100 transition-colors">
                                                        View Details
                                                    </span>
                                                )}
                                                {!notification.is_read && (
                                                    <button
                                                        onClick={(e) => handleMarkRead(notification.id, e)}
                                                        className="text-xs font-bold text-gray-500 hover:text-indigo-600 px-2 py-1.5 rounded-lg transition-colors"
                                                    >
                                                        Mark Read
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Delete Activity */}
                                    <button
                                        onClick={(e) => handleDelete(notification.id, e)}
                                        className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                        title="Delete notification"
                                    >
                                        <Trash2 size={18} />
                                    </button>

                                    {/* Unread Indicator */}
                                    {!notification.is_read && (
                                        <div className="absolute top-6 left-0 w-1 h-8 bg-blue-500 rounded-r-full" />
                                    )}
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

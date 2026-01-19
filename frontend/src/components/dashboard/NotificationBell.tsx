import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { api } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
// @ts-ignore
import { useNavigate } from 'react-router-dom';

export const NotificationBell = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Polling for MVP simplicity
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // 30s poll
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const countRes = await api.get('/notifications/unread-count');
            setUnreadCount(countRes.data.data.count);

            if (isOpen) {
                const listRes = await api.get('/notifications?limit=5');
                setNotifications(listRes.data.data.items);
            }
        } catch (err) {
            console.error('Notify fetch failed', err);
        }
    };

    // Refresh list when opened
    useEffect(() => {
        if (isOpen) {
            fetchNotificationsWrapper();
        }
    }, [isOpen]);

    const fetchNotificationsWrapper = async () => {
        const listRes = await api.get('/notifications?limit=5');
        setNotifications(listRes.data.data.items);
    };

    const handleMarkRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await api.patch(`/notifications/${id}/read`);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleClick = async (notification: any) => {
        if (!notification.is_read) {
            await api.patch(`/notifications/${notification.id}/read`);
        }
        setIsOpen(false);
        if (notification.action_url) {
            navigate(notification.action_url);
        }
    };

    const handleMarkAllRead = async () => {
        await api.patch('/notifications/mark-all-read');
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
                    >
                        <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-900">Notifications</h3>
                            {unreadCount > 0 && (
                                <button onClick={handleMarkAllRead} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                                    Mark all read
                                </button>
                            )}
                        </div>

                        <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 text-sm">
                                    No notifications yet
                                </div>
                            ) : (
                                notifications.map(notif => (
                                    <div
                                        key={notif.id}
                                        onClick={() => handleClick(notif)}
                                        className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors relative group ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${notif.priority === 'high' ? 'bg-red-500' :
                                                    notif.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                                                }`} />
                                            <div className="flex-1">
                                                <h4 className={`text-sm ${!notif.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                    {notif.title}
                                                </h4>
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notif.message}</p>
                                                <span className="text-[10px] text-gray-400 mt-2 block">
                                                    {new Date(notif.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                            {!notif.is_read && (
                                                <button
                                                    onClick={(e) => handleMarkRead(notif.id, e)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-indigo-600 transition-opacity"
                                                    title="Mark as read"
                                                >
                                                    <Check size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                            <button className="text-xs font-bold text-gray-500 hover:text-gray-900">
                                View All History
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

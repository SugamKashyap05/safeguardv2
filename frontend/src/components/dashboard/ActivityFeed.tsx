import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Video, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';

export const ActivityFeed = ({ activity }: any) => {
    if (!activity?.recentActivity) return null;

    const getIcon = (type: string) => {
        switch (type) {
            case 'child_login': return <CheckCircle size={16} className="text-green-500" />;
            case 'failed_pin_attempt': return <ShieldAlert size={16} className="text-red-500" />;
            case 'video_blocked': return <AlertCircle size={16} className="text-orange-500" />;
            default: return <Video size={16} className="text-blue-500" />;
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Recent Activity</h3>
            <div className="space-y-6">
                {activity.recentActivity.map((item: any, i: number) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex gap-4"
                    >
                        <div className="relative">
                            <div className={clsx(
                                "w-10 h-10 rounded-full flex items-center justify-center border-2",
                                item.type.includes('blocked') ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"
                            )}>
                                {getIcon(item.type)}
                            </div>
                            {i !== activity.recentActivity.length - 1 && (
                                <div className="absolute top-10 left-1/2 w-0.5 h-full bg-gray-100 -translate-x-1/2" />
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <p className="text-sm font-medium text-gray-800">
                                    <span className="font-bold">{item.children?.name}</span> {item.type.replace('_', ' ')}
                                </p>
                                <span className="text-xs text-gray-400 whitespace-nowrap">
                                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            {item.data?.reason && (
                                <p className="text-xs text-red-500 mt-1 bg-red-50 px-2 py-1 rounded-md inline-block">
                                    {item.data.reason}
                                </p>
                            )}
                        </div>
                    </motion.div>
                ))}

                {activity.recentActivity.length === 0 && (
                    <div className="text-center text-gray-400 py-8">No recent activity</div>
                )}
            </div>
        </div>
    );
};

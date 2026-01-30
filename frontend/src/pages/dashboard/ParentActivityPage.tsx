import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { HistoryList } from '../../components/dashboard/HistoryList';
import { ActivityStats } from '../../components/dashboard/ActivityStats';
import { Shield, Play, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { useParams } from 'react-router-dom';

export const ParentActivityPage = () => {
    const { childId } = useParams<{ childId: string }>();
    const [activeTab, setActiveTab] = useState<'history' | 'stats' | 'blocked'>('history');
    const [blockedHistory, setBlockedHistory] = useState<any[]>([]);
    const [loadingBlocked, setLoadingBlocked] = useState(false);

    useEffect(() => {
        if (activeTab === 'blocked' && childId) {
            fetchBlockedHistory();
        }
    }, [activeTab, childId]);

    const fetchBlockedHistory = async () => {
        if (!childId) return;
        setLoadingBlocked(true);
        try {
            const res = await api.get(`/analytics/blocked/${childId}`);
            setBlockedHistory(res.data.data);
        } catch (err) {
            console.error('Failed to fetch blocked history', err);
        } finally {
            setLoadingBlocked(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Activity & History</h1>
                    <p className="text-gray-500">Track what they are watching and when</p>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200">
                {['history', 'stats', 'blocked'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`pb-4 px-2 text-sm font-bold capitalize transition-colors border-b-2 ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[500px]">
                {activeTab === 'history' && childId && <HistoryList childId={childId} />}
                {activeTab === 'stats' && childId && <ActivityStats childId={childId} />}
                {activeTab === 'blocked' && (
                    <div>
                        {loadingBlocked ? (
                            <div className="text-center py-12 text-gray-400">Loading blocked events...</div>
                        ) : blockedHistory.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Shield size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800">Clean Record!</h3>
                                <p className="text-gray-500 max-w-md mx-auto mt-2">
                                    No blocked content attempts recorded recently.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 p-4 bg-amber-50 text-amber-800 rounded-xl border border-amber-100 mb-6">
                                    <AlertTriangle size={20} />
                                    <p className="font-medium">These videos were blocked based on your content filters.</p>
                                </div>
                                {blockedHistory.map((item) => (
                                    <div key={item.id} className="flex gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                                        <div className="relative w-40 aspect-video rounded-lg overflow-hidden bg-gray-200 shrink-0">
                                            {item.thumbnail ? (
                                                <img src={item.thumbnail} alt={item.video_title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400"><Play size={24} /></div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-800 line-clamp-1">{item.video_title}</h4>
                                            <p className="text-sm text-gray-500 font-medium mb-2">{item.channel_name}</p>
                                            <div className="flex gap-4 text-xs text-gray-400 mb-2">
                                                <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(item.watched_at).toLocaleDateString()}</span>
                                                <span className="flex items-center gap-1"><Clock size={12} /> {new Date(item.watched_at).toLocaleTimeString()}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg flex items-center gap-1">
                                                    <Shield size={10} />
                                                    Blocked: {item.block_reason || 'Content Filter'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

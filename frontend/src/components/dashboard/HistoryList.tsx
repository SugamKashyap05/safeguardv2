import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Play, Calendar, Clock } from 'lucide-react';

interface WatchHistoryItem {
    id: string;
    video_title: string;
    video_id: string;
    channel_name: string;
    thumbnail?: string;
    watched_duration: number;
    watched_at: string;
    was_blocked?: boolean;
    block_reason?: string;
}

export const HistoryList = ({ childId }: { childId: string }) => {
    const [history, setHistory] = useState<WatchHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadHistory = async () => {
            try {
                if (!childId) return;
                const res = await api.get(`/watch/history/${childId}`);
                setHistory(res.data.data.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadHistory();
    }, [childId]);

    if (loading) return <div className="p-8 text-center text-gray-400">Loading history...</div>;
    if (history.length === 0) return <div className="p-8 text-center text-gray-400">No watch history yet.</div>;

    return (
        <div className="space-y-4">
            {history.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                    <div className="relative w-40 aspect-video rounded-lg overflow-hidden bg-gray-200 shrink-0">
                        {item.thumbnail ? (
                            <img src={item.thumbnail} alt={item.video_title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400"><Play size={24} /></div>
                        )}
                        <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1 rounded">
                            {Math.floor((item.watched_duration || 0) / 60)}m
                        </div>
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-gray-800 line-clamp-1">{item.video_title}</h4>
                        <p className="text-sm text-gray-500 font-medium mb-2">{item.channel_name}</p>
                        <div className="flex gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(item.watched_at).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1"><Clock size={12} /> {new Date(item.watched_at).toLocaleTimeString()}</span>
                        </div>
                        {item.was_blocked && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded">
                                Blocked: {item.block_reason}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

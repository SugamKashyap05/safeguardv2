import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Plus, Check } from 'lucide-react';

export const ChannelBrowser = ({ childId, refresh }: { childId: string, refresh?: () => void }) => {
    const [lists, setLists] = useState<any>(null);

    useEffect(() => {
        const load = async () => {
            const res = await api.get('/channels/discover');
            setLists(res.data.data);
        };
        load();
    }, []);

    const handleQuickApprove = async (channel: any) => {
        try {
            await api.post('/channels/direct-approve', {
                childId,
                channel: {
                    channelId: channel.id,
                    channelName: channel.title,
                    thumbnailUrl: channel.thumbnail
                }
            });
            // Show Success UI state
            if (refresh) refresh();
        } catch (err) {
            console.error(err);
        }
    };

    if (!lists) return <div>Loading Discovery...</div>;

    return (
        <div className="space-y-8">
            {Object.entries(lists).map(([category, channels]: [string, any]) => (
                <div key={category}>
                    <h3 className="text-xl font-bold text-gray-800 capitalize mb-4">{category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {channels.map((channel: any) => (
                            <div key={channel.id} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-start gap-4 hover:shadow-md transition-shadow">
                                <img src={channel.thumbnail} alt="" className="w-16 h-16 rounded-xl object-cover bg-gray-100" />
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-900 line-clamp-1">{channel.title}</h4>
                                    <button
                                        onClick={() => handleQuickApprove(channel)}
                                        className="mt-2 text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-indigo-100 transition-colors"
                                    >
                                        <Plus size={12} /> Add to Safe List
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Plus, Check, Search, Youtube } from 'lucide-react';

export const ChannelBrowser = ({ childId, refresh }: { childId: string, refresh?: () => void }) => {
    const [lists, setLists] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [addedChannels, setAddedChannels] = useState<Set<string>>(new Set());

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
            // Optimistic update
            setAddedChannels(prev => new Set(prev).add(channel.id));
            if (refresh) refresh();
        } catch (err) {
            console.error(err);
        }
    };

    if (!lists) return (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium animate-pulse">Curating best channels...</p>
        </div>
    );

    // Filter logic
    const filteredLists = Object.entries(lists).reduce((acc: any, [category, channels]: [string, any]) => {
        const filteredChannels = channels.filter((c: any) =>
            c.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (filteredChannels.length > 0) {
            acc[category] = filteredChannels;
        }
        return acc;
    }, {});

    const hasResults = Object.keys(filteredLists).length > 0;

    return (
        <div className="space-y-8">
            {/* Search Header */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Discover Safe Content</h2>
                    <p className="text-gray-500 text-sm">Hand-picked educational and fun channels</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search for channels..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    />
                </div>
            </div>

            {hasResults ? (
                Object.entries(filteredLists).map(([category, channels]: [string, any]) => (
                    <div key={category} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3 mb-5">
                            <h3 className="text-lg font-bold text-gray-900 capitalize">{category}</h3>
                            <div className="h-px bg-gray-100 flex-1"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {channels.map((channel: any) => {
                                const isAdded = addedChannels.has(channel.id);
                                return (
                                    <div key={channel.id} className="group bg-white rounded-2xl p-4 border border-gray-100 flex items-start gap-4 hover:shadow-lg hover:border-primary/20 transition-all duration-300 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-inner">
                                            {channel.thumbnail ? (
                                                <img src={channel.thumbnail} alt="" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Youtube className="text-gray-400 w-8 h-8" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-gray-900 line-clamp-1 mb-1 group-hover:text-primary transition-colors">{channel.title}</h4>
                                            <p className="text-xs text-gray-500 mb-3 line-clamp-2">highly recommended for learning</p>

                                            <button
                                                onClick={() => !isAdded && handleQuickApprove(channel)}
                                                disabled={isAdded}
                                                className={`
                                                    text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all
                                                    ${isAdded
                                                        ? 'bg-green-100 text-green-700 cursor-default'
                                                        : 'bg-gray-900 text-white hover:bg-primary hover:shadow-lg hover:shadow-primary/30 active:scale-95'}
                                                `}
                                            >
                                                {isAdded ? (
                                                    <><Check size={12} strokeWidth={3} /> Added to Safe List</>
                                                ) : (
                                                    <><Plus size={12} strokeWidth={3} /> Add Channel</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center py-20">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 grayscale opacity-50">
                        <Youtube className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">No results found</h3>
                    <p className="text-gray-500">Try searching for something else like "Science" or "Math"</p>
                </div>
            )}
        </div>
    );
};

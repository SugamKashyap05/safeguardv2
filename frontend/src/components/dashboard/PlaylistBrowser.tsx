import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
// @ts-ignore
import { Plus, Check, Search, ListVideo, PlaySquare } from 'lucide-react';

// @ts-ignore
export const PlaylistBrowser = ({ childId, refresh }: { childId: string, refresh?: () => void }) => {
    const [lists, setLists] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [addedPlaylists, setAddedPlaylists] = useState<Set<string>>(new Set());

    useEffect(() => {
        const load = async () => {
            // Pass childId to filter out already added playlists
            const res = await api.get(`/playlists/discover?childId=${childId}`);
            setLists(res.data.data);
        };
        load();
    }, [childId]); // Reload when childId changes

    const handleAddPlaylist = async (playlist: any) => {
        try {
            // Create the playlist in the backend
            await api.post('/playlists', {
                childId,
                name: playlist.title,
                description: playlist.description
            });

            // In a real app we might also copy the items here, but for now we just create the container

            // Optimistic update
            setAddedPlaylists(prev => new Set(prev).add(playlist.id));
            if (refresh) refresh();

            // Re-fetch to update the list (filtering logic happens on backend)
            // Ideally we just remove it locally to be snappy
            const newLists = { ...lists };
            for (const cat in newLists) {
                newLists[cat] = newLists[cat].filter((p: any) => p.id !== playlist.id);
            }
            setLists(newLists);

        } catch (err) {
            console.error(err);
        }
    };

    if (!lists) return (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium animate-pulse">Finding best playlists...</p>
        </div>
    );

    // Filter logic
    const filteredLists = Object.entries(lists).reduce((acc: any, [category, playlists]: [string, any]) => {
        const filtered = playlists.filter((p: any) =>
            p.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (filtered.length > 0) {
            acc[category] = filtered;
        }
        return acc;
    }, {});

    const hasResults = Object.keys(filteredLists).length > 0;

    return (
        <div className="space-y-8">
            {/* Search Header */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Discover Playlists</h2>
                    <p className="text-gray-500 text-sm">Curated collections for learning and fun</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search playlists..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    />
                </div>
            </div>

            {hasResults ? (
                Object.entries(filteredLists).map(([category, playlists]: [string, any]) => (
                    <div key={category} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3 mb-5">
                            <h3 className="text-lg font-bold text-gray-900 capitalize">{category}</h3>
                            <div className="h-px bg-gray-100 flex-1"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {playlists.map((playlist: any) => {
                                const isAdded = addedPlaylists.has(playlist.id);
                                return (
                                    <div key={playlist.id} className="group bg-white rounded-2xl p-4 border border-gray-100 flex items-start gap-4 hover:shadow-lg hover:border-primary/20 transition-all duration-300 relative overflow-hidden">

                                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-inner relative group-hover:scale-105 transition-transform duration-500">
                                            {playlist.thumbnail ? (
                                                <img src={playlist.thumbnail} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ListVideo className="text-gray-400 w-8 h-8" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                                <div className="bg-black/40 px-2 py-0.5 rounded text-[10px] text-white font-bold backdrop-blur-sm">
                                                    {playlist.item_count} videos
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-gray-900 line-clamp-1 mb-1 group-hover:text-primary transition-colors">{playlist.title}</h4>
                                            <p className="text-xs text-gray-500 mb-3 line-clamp-2">{playlist.description}</p>

                                            <button
                                                onClick={() => !isAdded && handleAddPlaylist(playlist)}
                                                disabled={isAdded}
                                                className={`
                                                    text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all w-full justify-center
                                                    ${isAdded
                                                        ? 'bg-green-100 text-green-700 cursor-default'
                                                        : 'bg-black text-white hover:bg-primary hover:shadow-lg hover:shadow-primary/30 active:scale-95'}
                                                `}
                                            >
                                                {isAdded ? (
                                                    <><Check size={12} strokeWidth={3} /> Added</>
                                                ) : (
                                                    <><Plus size={12} strokeWidth={3} /> Add Playlist</>
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
                <div className="text-center py-24 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <Check className="w-10 h-10 text-green-500" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">All Caught Up!</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                        You've added all our recommended playlists for now. Check back later for new content!
                    </p>
                </div>
            )}
        </div>
    );
};

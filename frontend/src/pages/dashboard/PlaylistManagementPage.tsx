import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
// @ts-ignore
import { LayoutGrid, ListPlus, Trash2, Edit2, PlaySquare, Plus } from 'lucide-react';
// @ts-ignore
import { motion, AnimatePresence } from 'framer-motion';
import { PlaylistBrowser } from '../../components/dashboard/PlaylistBrowser';

export const PlaylistManagementPage = () => {
    const { childId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'my_playlists' | 'discover'>('my_playlists');
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const loadPlaylists = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/playlists/${childId}`);
            setPlaylists(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPlaylists();
    }, [childId]);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this playlist?')) return;
        try {
            await api.delete(`/playlists/${id}`);
            loadPlaylists(); // Refresh
        } catch (err) {
            alert('Could not delete playlist. Default playlists cannot be deleted.');
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen bg-[#FDFDFD]">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                        <span className="bg-gradient-to-r from-pink-500 to-rose-500 text-transparent bg-clip-text">Playlist</span> Manager
                    </h1>
                    <p className="text-gray-500 mt-2 text-lg">Curate and discover safe video collections</p>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="flex p-1 bg-white rounded-2xl border border-gray-200 shadow-sm w-fit relative z-0">
                {[
                    { id: 'my_playlists', label: 'My Playlists', icon: LayoutGrid },
                    { id: 'discover', label: 'Discover New', icon: ListPlus },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`
                            relative px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-300
                            ${activeTab === tab.id ? 'text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}
                        `}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="active-tab-playlist"
                                className="absolute inset-0 bg-gray-900 rounded-xl shadow-lg -z-10"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <tab.icon size={18} strokeWidth={2.5} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                {activeTab === 'discover' ? (
                    <motion.div
                        key="discover"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        <PlaylistBrowser childId={childId!} refresh={loadPlaylists} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="my_playlists"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : playlists.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <ListPlus className="text-gray-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">No playlists yet</h3>
                                <p className="text-gray-500 mb-6">Create one or discover recommended lists</p>
                                <button
                                    onClick={() => setActiveTab('discover')}
                                    className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-gray-800 transition-colors"
                                >
                                    Browse Discovery
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {/* Create New Card */}
                                <button
                                    onClick={() => {/* TODO: Open Create Modal */ }}
                                    className="group flex flex-col items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 h-[280px] hover:border-gray-900 hover:bg-gray-100 transition-all"
                                >
                                    <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Plus className="w-6 h-6 text-gray-900" />
                                    </div>
                                    <span className="font-bold text-gray-900">Create New Playlist</span>
                                </button>

                                {playlists.map((playlist) => (
                                    <div
                                        key={playlist.id}
                                        onClick={() => navigate(`/dashboard/child/${childId}/playlist/${playlist.id}`)}
                                        className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-[280px]"
                                    >
                                        <div className="h-40 bg-gray-100 relative overflow-hidden">
                                            {playlist.thumbnail ? (
                                                <img src={playlist.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                                    <PlaySquare className="text-gray-300 w-12 h-12" />
                                                </div>
                                            )}

                                            {/* Badge for Type */}
                                            <div className="absolute top-3 right-3">
                                                {playlist.is_default ? (
                                                    <span className="bg-black/50 backdrop-blur-md text-white px-2 py-1 rounded-lg text-xs font-bold">
                                                        System
                                                    </span>
                                                ) : (
                                                    <span className="bg-white/80 backdrop-blur-md text-gray-900 px-2 py-1 rounded-lg text-xs font-bold shadow-sm">
                                                        Custom
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-5 flex flex-col flex-1">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-gray-900 text-lg line-clamp-1 mb-1">{playlist.name}</h3>
                                                <p className="text-gray-500 text-sm line-clamp-1">
                                                    {playlist.item_count} videos
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-4">
                                                <span className="text-xs font-medium text-gray-400">
                                                    Updated {new Date(playlist.updated_at).toLocaleDateString()}
                                                </span>

                                                {!playlist.is_default && (
                                                    <button
                                                        onClick={(e) => handleDelete(playlist.id, e)}
                                                        className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

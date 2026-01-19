import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, LogOut } from 'lucide-react';
import { api } from '../../services/api';
import { ChildTimer } from '../../components/children/ChildTimer';
// @ts-ignore
import { useNavigate, useLocation } from 'react-router-dom';

export const ChildDashboardPage = () => {
    const navigate = useNavigate();
    const [videos, setVideos] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    // Retrieve child from local storage or context (Simulated for this MVP)
    // In real app, we'd use a Context Provider.
    const childId = localStorage.getItem('activeChildId');
    const childName = localStorage.getItem('activeChildName');

    useEffect(() => {
        if (!childId) {
            navigate('/child/login');
            return;
        }
        // Load initial recommended videos (or trending)
        searchVideos('cartoons');
    }, [childId]);

    const searchVideos = async (query: string) => {
        setLoading(true);
        try {
            // Use the YouTube service endpoint
            // Pass 'childId' header or query param if needed for content filtering, 
            // but the backend might infer it from session token if we had one.
            // For now, let's just use the public search but add childId to query for filtering if backend supports it.
            const res = await api.get(`/youtube/search`, { params: { q: query, childId } });
            setVideos(res.data.data.items || []);
        } catch (err) {
            console.error('Search failed', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) searchVideos(searchQuery);
    };

    const handleLogout = () => {
        localStorage.removeItem('activeChildId');
        localStorage.removeItem('activeChildName');
        navigate('/child/login');
    };

    if (!childId) return null;

    return (
        <div className="min-h-screen bg-[#FFFDF5] text-gray-800 font-sans">
            {/* Timer Overlay */}
            <ChildTimer childId={childId} />

            {/* Header */}
            <header className="sticky top-0 bg-white/80 backdrop-blur-md z-30 px-6 py-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-2xl shadow-inner border-2 border-yellow-200">
                        {/* Avatar placeholder, ideally passed or fetched */}
                        🐼
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-gray-800 tracking-tight">Hi {childName}!</h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">SafeGuard Kids</p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-colors"
                >
                    <LogOut size={20} />
                </button>
            </header>

            {/* Search Hero */}
            <div className="p-6">
                <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-8 group">
                    <div className="absolute inset-0 bg-yellow-400 rounded-3xl blur opacity-20 group-hover:opacity-40 transition-opacity" />
                    <div className="relative flex items-center bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-transparent focus-within:border-yellow-400 transition-colors">
                        <div className="pl-6 text-gray-400">
                            <Search size={24} />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="What do you want to watch?"
                            className="w-full p-4 text-lg font-bold text-gray-700 placeholder-gray-300 outline-none"
                        />
                        <button type="submit" className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-black px-8 py-4 transition-colors">
                            GO!
                        </button>
                    </div>
                </form>

                {/* Video Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
                    {loading ? (
                        [...Array(8)].map((_, i) => (
                            <div key={i} className="aspect-video bg-gray-200 rounded-3xl animate-pulse" />
                        ))
                    ) : (
                        videos.map((video: any) => (
                            <motion.div
                                key={video.id.videoId}
                                whileHover={{ scale: 1.05, y: -10 }}
                                className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100 cursor-pointer group"
                            >
                                <div className="aspect-video relative overflow-hidden">
                                    <img
                                        src={video.snippet.thumbnails.high.url}
                                        alt={video.snippet.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="w-16 h-16 bg-yellow-400 text-yellow-900 rounded-full flex items-center justify-center shadow-xl transform scale-50 group-hover:scale-110 transition-transform">
                                            <Search size={32} fill="currentColor" className="ml-1" /> {/* Actually Play Icon */}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-gray-800 line-clamp-2 leading-tight">
                                        {video.snippet.title}
                                    </h3>
                                    <p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-wide">
                                        {video.snippet.channelTitle}
                                    </p>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

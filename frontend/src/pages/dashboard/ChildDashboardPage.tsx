import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, LogOut } from 'lucide-react';
import { api } from '../../services/api';
import { ChildTimer } from '../../components/children/ChildTimer';
import { SafeVideoPlayer } from '../../components/children/SafeVideoPlayer';
import { VideoPlayerModal } from '../../components/children/VideoPlayerModal'; // Keeping for fallback if needed, or remove
// @ts-ignore
import { useNavigate, useLocation } from 'react-router-dom';

export const ChildDashboardPage = () => {
    const navigate = useNavigate();
    const [videos, setVideos] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Retrieve child from local storage or context (Simulated for this MVP)
    // In real app, we'd use a Context Provider.
    const childId = localStorage.getItem('activeChildId');
    const childName = localStorage.getItem('activeChildName');

    useEffect(() => {
        if (!childId) {
            navigate('/child/login');
            return;
        }
        // Load Recommendations
        loadRecommendations();
        loadSuggestions();
    }, [childId]);

    const loadSuggestions = async () => {
        try {
            const res = await api.get(`/search/suggestions/${childId}`);
            setSuggestions(res.data.data || []);
        } catch (e) {
            console.error('Failed suggestions', e);
        }
    };

    const loadRecommendations = async () => {
        setLoading(true);
        try {
            const [pRes, tRes, eRes] = await Promise.all([
                api.get(`/recommendations/${childId}/personalized`),
                api.get(`/recommendations/${childId}/trending`),
                api.get(`/recommendations/${childId}/educational`)
            ]);
            setPersonalized(pRes.data.data.items);
            setTrending(tRes.data.data.items);
            setEducational(eRes.data.data.items);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const searchVideos = async (query: string) => {
        setLoading(true);
        try {
            // Use the Safe Search endpoint
            const res = await api.get(`/search`, { params: { q: query, childId } });
            // If searching, we replace the "view" with search results
            // But maybe we should have a "Search Mode"? 
            // For MVP, if query exists, show grid of results. If not, show Sections.
            setVideos(res.data.data || []);
            setShowSuggestions(false);
        } catch (err: any) {
            console.error('Search failed', err);
            if (err.response?.status === 400) {
                alert(err.response.data.message || 'That search didn\'t look safe. Try something else!');
                setSearchQuery('');
            }
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
                            onFocus={() => setShowSuggestions(true)}
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

// --- Sub Comps ---

const Section = ({ title, videos, onPlay, color, icon }: any) => {
    if (!videos || videos.length === 0) return null;
    return (
        <div className="max-w-[95vw] mx-auto">
            <div className="flex items-center gap-3 mb-6 px-4">
                <span className="text-2xl">{icon}</span>
                <h2 className={`text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r ${color}`}>{title}</h2>
            </div>

            {/* Horizontal Scroll */}
            <div className="flex gap-6 overflow-x-auto pb-8 px-4 snap-x hide-scrollbar">
                {videos.map((video: any) => (
                    <div key={video.videoId} className="snap-start shrink-0 w-[280px] sm:w-[320px]">
                        <VideoCard video={video} onPlay={onPlay} />
                    </div>
                ))}
            </div>
        </div>
    );
};

const VideoCard = ({ video, onPlay }: any) => (
    <motion.div
        whileHover={{ scale: 1.05, y: -5 }}
        className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-50 cursor-pointer group h-full flex flex-col"
        onClick={() => onPlay({
            id: { videoId: video.videoId },
            snippet: {
                title: video.title,
                channelTitle: video.channelTitle,
                description: '',
                thumbnails: { high: { url: video.thumbnail }, default: { url: video.thumbnail } }
            }
        })}
    >
        <div className="aspect-video relative overflow-hidden bg-gray-100">
            <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-14 h-14 bg-white/90 text-black rounded-full flex items-center justify-center shadow-xl">
                    <div className="ml-1 w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-black border-b-[8px] border-b-transparent" />
                </div>
            </div>
            <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                10:05
            </span>
        </div>
        <div className="p-4 flex-1 flex flex-col">
            <h3 className="font-bold text-gray-800 line-clamp-2 leading-tight mb-auto">
                {video.title}
            </h3>
            <div className="mt-3 flex items-center justify-between">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide truncate pr-2">
                    {video.channelTitle}
                </p>
                {/* <span className="w-2 h-2 rounded-full bg-green-400" title="Safe" /> */}
            </div>
        </div>
    </motion.div>
);

const VideoGrid = ({ videos, onPlay }: any) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4">
        {videos.map((video: any) => (
            <VideoCard
                key={video.id.videoId}
                video={{
                    videoId: video.id.videoId,
                    title: video.snippet.title,
                    thumbnail: video.snippet.thumbnails.high.url,
                    channelTitle: video.snippet.channelTitle
                }}
                onPlay={onPlay}
            />
        ))}
    </div>
);

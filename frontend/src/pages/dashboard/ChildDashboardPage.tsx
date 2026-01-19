import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, LogOut, Sparkles, TrendingUp, GraduationCap, X, Play } from 'lucide-react';
import { api } from '../../services/api';
import { ChildTimer } from '../../components/children/ChildTimer';
import { SafeVideoPlayer } from '../../components/children/SafeVideoPlayer';
import { useNavigate } from 'react-router-dom';

export const ChildDashboardPage = () => {
    const navigate = useNavigate();
    const [videos, setVideos] = useState<any[]>([]); // Search results
    const [personalized, setPersonalized] = useState<any[]>([]);
    const [trending, setTrending] = useState<any[]>([]);
    const [educational, setEducational] = useState<any[]>([]);

    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [isPaused, setIsPaused] = useState(false);
    const [pauseReason, setPauseReason] = useState<string | null>(null);

    const [selectedVideo, setSelectedVideo] = useState<any | null>(null);

    // Retrieve child from local storage or context
    const childId = localStorage.getItem('activeChildId');
    const childName = localStorage.getItem('activeChildName');

    useEffect(() => {
        if (!childId) {
            navigate('/child/login');
            return;
        }
        // Load Data
        loadRecommendations();
        loadSuggestions();
        checkStatus();

        // Poll status every minute
        const interval = setInterval(checkStatus, 60000);
        return () => clearInterval(interval);
    }, [childId, navigate]);

    const checkStatus = async () => {
        try {
            // Check potential pause status via a sensitive endpoint
            await api.get(`/search/history/${childId}`);
        } catch (e: any) {
            if (e.response?.status === 403) {
                setIsPaused(true);
                setPauseReason(e.response?.data?.message || "Paused");
            }
        }
    };



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
            setPersonalized(pRes.data.data.items || []);
            setTrending(tRes.data.data.items || []);
            setEducational(eRes.data.data.items || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const searchVideos = async (query: string) => {
        setLoading(true);
        try {
            const res = await api.get(`/search`, { params: { q: query, childId } });
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

    const handleVideoClick = (video: any) => {
        // Normalize video object for player
        const normalizedVideo = {
            videoId: video.id?.videoId || video.videoId,
            title: video.snippet?.title || video.title,
            channelTitle: video.snippet?.channelTitle || video.channelTitle
        };
        setSelectedVideo(normalizedVideo);
    };

    if (!childId) return null;

    return (
        <div className="min-h-screen bg-[#FFFDF5] text-gray-800 font-sans relative overflow-x-hidden">
            {/* Pause Overlay */}
            <AnimatePresence>
                {isPaused && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center text-white p-8 text-center"
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white/10 p-8 rounded-3xl border border-white/20 max-w-lg w-full"
                        >
                            <span className="text-6xl mb-6 block">😴</span>
                            <h2 className="text-4xl font-black mb-4">Time for a Break!</h2>
                            <p className="text-xl text-gray-300 font-bold mb-8">
                                {pauseReason || "Your parent has paused screen time for now."}
                            </p>
                            <div className="animate-pulse text-sm font-bold bg-white/20 py-2 px-4 rounded-full inline-block">
                                Ask your parent to resume
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedVideo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
                    >
                        <div className="w-full max-w-6xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl relative">
                            <button
                                onClick={() => setSelectedVideo(null)}
                                className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-colors"
                            >
                                <X size={24} />
                            </button>
                            <SafeVideoPlayer
                                videoId={selectedVideo.videoId}
                                childId={childId}
                                onComplete={() => setSelectedVideo(null)}
                                onClose={() => setSelectedVideo(null)}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Timer Overlay */}
            <ChildTimer childId={childId} />

            {/* Header */}
            <header className="sticky top-0 bg-white/80 backdrop-blur-md z-30 px-6 py-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-2xl shadow-inner border-2 border-yellow-200">
                        {/* Avatar placeholder */}
                        🐼
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-gray-800 tracking-tight">Hi {childName}!</h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">SafeGuard Kids</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleLogout}
                        className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-colors"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {/* Search Hero */}
            <div className="p-6 relative z-20">
                <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-8 group">
                    <div className="absolute inset-0 bg-yellow-400 rounded-3xl blur opacity-20 group-hover:opacity-40 transition-opacity" />
                    <div className="relative flex items-center bg-white rounded-3xl shadow-xl overflow-visible border-4 border-transparent focus-within:border-yellow-400 transition-colors z-20">
                        <div className="pl-6 text-gray-400">
                            <Search size={24} />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="What do you want to watch?"
                            className="w-full p-4 text-lg font-bold text-gray-700 placeholder-gray-300 outline-none bg-transparent"
                        />
                        <button type="submit" className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-black px-8 py-4 transition-colors rounded-r-[20px]">
                            GO!
                        </button>
                    </div>

                    {/* Suggestions Dropdown */}
                    <AnimatePresence>
                        {showSuggestions && suggestions.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-full left-4 right-4 bg-white rounded-b-3xl rounded-t-lg shadow-xl border border-gray-100 mt-[-20px] pt-6 overflow-hidden z-10"
                            >
                                {suggestions.map((suggestion, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery(suggestion);
                                            searchVideos(suggestion);
                                        }}
                                        className="w-full text-left px-6 py-3 hover:bg-yellow-50 font-bold text-gray-600 transition-colors flex items-center gap-3 border-b border-gray-50 last:border-0"
                                    >
                                        <Search size={16} className="text-gray-400" />
                                        {suggestion}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>

                {/* Main Content Area */}
                <div className="max-w-[95vw] mx-auto pb-20">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="aspect-video bg-gray-200 rounded-3xl animate-pulse" />
                            ))}
                        </div>
                    ) : videos.length > 0 ? (
                        /* Search Results */
                        <div>
                            <div className="flex items-center gap-3 mb-6 px-4">
                                <Search size={24} className="text-yellow-500" />
                                <h2 className="text-2xl font-black text-gray-800">Results for "{searchQuery}"</h2>
                            </div>
                            <VideoGrid videos={videos} onPlay={handleVideoClick} />
                        </div>
                    ) : (
                        /* Dashboard Sections */
                        <div className="space-y-12">
                            <Section
                                title="Just for You"
                                icon={<Sparkles className="text-purple-500" />}
                                color="from-purple-500 to-indigo-500"
                                videos={personalized}
                                onPlay={handleVideoClick}
                            />
                            <Section
                                title="Trending Now"
                                icon={<TrendingUp className="text-orange-500" />}
                                color="from-orange-500 to-red-500"
                                videos={trending}
                                onPlay={handleVideoClick}
                            />
                            <Section
                                title="Learn & Grow"
                                icon={<GraduationCap className="text-green-500" />}
                                color="from-green-500 to-emerald-500"
                                videos={educational}
                                onPlay={handleVideoClick}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Sub Components ---

const Section = ({ title, videos, onPlay, color, icon }: any) => {
    if (!videos || videos.length === 0) return null;
    return (
        <div className="max-w-full">
            <div className="flex items-center gap-3 mb-6 px-4">
                <span className="text-2xl p-2 bg-white rounded-xl shadow-sm border border-gray-100">{icon}</span>
                <h2 className={`text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r ${color}`}>{title}</h2>
            </div>

            {/* Horizontal Scroll */}
            <div className="flex gap-6 overflow-x-auto pb-8 px-4 snap-x hide-scrollbar">
                {videos.map((video: any) => (
                    <div key={video.id?.videoId || video.videoId} className="snap-start shrink-0 w-[280px] sm:w-[320px]">
                        <VideoCard video={video} onPlay={onPlay} />
                    </div>
                ))}
            </div>
        </div>
    );
};

const VideoCard = ({ video, onPlay }: any) => {

    const title = video.snippet?.title || video.title;
    const channelTitle = video.snippet?.channelTitle || video.channelTitle;
    const thumbnail = video.snippet?.thumbnails?.high?.url || video.thumbnail || video.snippet?.thumbnails?.default?.url;

    return (
        <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white rounded-3xl overflow-hidden shadow-xl shadow-gray-100/50 border border-gray-50 cursor-pointer group h-full flex flex-col"
            onClick={() => onPlay(video)}
        >
            <div className="aspect-video relative overflow-hidden bg-gray-100">
                <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 bg-white/90 text-black rounded-full flex items-center justify-center shadow-xl">
                        <Play size={24} fill="currentColor" className="ml-1" />
                    </div>
                </div>
            </div>
            <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-800 line-clamp-2 leading-tight mb-auto text-base">
                    {title}
                </h3>
                <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide truncate pr-2">
                        {channelTitle}
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

const VideoGrid = ({ videos, onPlay }: any) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4">
        {videos.map((video: any) => (
            <VideoCard
                key={video.id?.videoId || video.videoId}
                video={video}
                onPlay={onPlay}
            />
        ))}
    </div>
);


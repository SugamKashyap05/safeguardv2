import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, LogOut, Sparkles, TrendingUp, GraduationCap } from 'lucide-react';
import { api } from '../../services/api';
import { ChildTimer } from '../../components/children/ChildTimer';
import { SafeVideoPlayer } from '../../components/children/SafeVideoPlayer';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { VideoCard } from '../../components/children/VideoCard';
import { AddToPlaylistModal } from '../../components/playlists/AddToPlaylistModal';
import { Skeleton } from '../../components/common/Skeleton';
import { useGamification } from '../../contexts/GamificationContext';
import { StarDisplay } from '../../components/gamification/StarDisplay';
import { BadgeShowcase } from '../../components/gamification/BadgeShowcase';
import { LevelProgressBar } from '../../components/gamification/LevelProgressBar';
import { QuestLog } from '../../components/gamification/QuestLog';
import { AvatarEditor } from '../../components/gamification/AvatarEditor';

// --- Sub Components ---

function Section({ title, videos, onPlay, color, icon, onAddToPlaylist, childId }: any) {
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
                        <VideoCard
                            video={video}
                            onPlay={onPlay}
                            onAddToPlaylist={onAddToPlaylist}
                            childId={childId}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

function VideoGrid({ videos, onPlay, onAddToPlaylist, childId }: any) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4">
            {videos.map((video: any) => (
                <VideoCard
                    key={video.id?.videoId || video.videoId}
                    video={video}
                    onPlay={onPlay}
                    onAddToPlaylist={onAddToPlaylist}
                    childId={childId}
                />
            ))}
        </div>
    );
}

export const ChildDashboardPage = () => {
    const navigate = useNavigate();
    const { stars, totalStars, setStars, setTotalStars, badges, refreshBadges } = useGamification();
    // Assuming context doesn't expose total_stars_earned yet, let's use stars as proxy or update context.
    // Ideally update context, but for speed let's just use stars for now (assuming no spending yet).
    // Actually, spending exists in plan. Let's update context quickly.
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
    const [showDeviceSetup, setShowDeviceSetup] = useState(false);
    const [deviceName, setDeviceName] = useState('');

    // Playlist Modal State
    const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
    const [videoForPlaylist, setVideoForPlaylist] = useState<any>(null);
    const [showAvatarEditor, setShowAvatarEditor] = useState(false);

    const { socket } = useSocket() || {};

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
        refreshBadges(childId);

        // Poll status every minute
        const interval = setInterval(checkStatus, 60000);
        return () => clearInterval(interval);
    }, [childId, navigate]);

    useEffect(() => {
        const storedDeviceId = localStorage.getItem('safeguard_device_id');
        if (!storedDeviceId) {
            setShowDeviceSetup(true);
        }
    }, []);

    // Socket Listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('playback_paused', (data: any) => {
            if (data.reason === 'switched_device') {
                setIsPaused(true);
                setPauseReason("You started watching on another device.");
                setSelectedVideo(null); // Close player
            }
        });

        return () => {
            socket.off('playback_paused');
        };
    }, [socket]);

    const handleDeviceRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Generate a local ID for this hardware
            const deviceId = localStorage.getItem('safeguard_device_id') || crypto.randomUUID();

            // Detect platform/type simply
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            const platform = isMobile ? (navigator.userAgent.includes('Android') ? 'Android' : 'iOS') : 'Web';
            const type = isMobile ? 'mobile' : 'desktop';

            await api.post(`/devices/${childId}/register`, {
                deviceId,
                deviceName: deviceName.trim() || `My ${platform} Device`,
                deviceType: type,
                platform
            });

            localStorage.setItem('safeguard_device_id', deviceId);
            localStorage.setItem('safeguard_device_name', deviceName.trim());
            setShowDeviceSetup(false);
        } catch (err) {
            console.error("Device registration failed", err);
            // Optionally allow skip or retry
        }
    };

    const checkStatus = async () => {
        try {
            const token = localStorage.getItem('safeguard_token');
            if (!token) {
                console.log('No token found, redirecting to login');
                handleLogout();
                return;
            }

            const res = await api.get(`/children/${childId}/status`);
            const { isActive, pauseReason, stars, totalStars } = res.data.data;

            if (stars !== undefined) setStars(stars);
            if (totalStars !== undefined) setTotalStars(totalStars);

            if (!isActive) {
                setIsPaused(true);
                setPauseReason(pauseReason || "Paused by parent");
            } else {
                setIsPaused(false);
                setPauseReason(null);
            }
        } catch (e: any) {
            console.error("Status check failed", e);
            // If 403/401, it might mean completely locked out or invalid session
            if (e.response?.status === 401 || e.response?.status === 403) {
                console.log('Auth check failed:', e.response.status);
                handleLogout();
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

    const handleAddToPlaylist = (video: any) => {
        setVideoForPlaylist(video);
        setPlaylistModalOpen(true);
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

            {/* Device Setup Modal */}
            <AnimatePresence>
                {showDeviceSetup && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white rounded-3xl p-8 max-w-md w-full text-center"
                        >
                            <h2 className="text-3xl font-black text-gray-800 mb-2">New Device! 📱</h2>
                            <p className="text-gray-500 font-bold mb-6">What should we call this device?</p>

                            <form onSubmit={handleDeviceRegister}>
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="e.g. iPad, Living Room TV"
                                    className="w-full bg-gray-100 p-4 rounded-2xl font-bold text-gray-800 outline-none focus:ring-4 focus:ring-yellow-200 mb-6 text-center text-lg"
                                    value={deviceName}
                                    onChange={(e) => setDeviceName(e.target.value)}
                                    required
                                />
                                <button
                                    type="submit"
                                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-black py-4 rounded-2xl text-xl transition-transform hover:scale-105 active:scale-95"
                                >
                                    Start Watching! 🚀
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Playlist Modal */}
            <AnimatePresence>
                {videoForPlaylist && (
                    <AddToPlaylistModal
                        isOpen={playlistModalOpen}
                        onClose={() => setPlaylistModalOpen(false)}
                        video={videoForPlaylist}
                        childId={childId}
                    />
                )}
            </AnimatePresence>


            <AnimatePresence>
                {selectedVideo && (
                    <SafeVideoPlayer
                        videoId={selectedVideo.videoId}
                        videoTitle={selectedVideo.title}
                        channelId={selectedVideo.channelId || 'Unknown'}
                        channelName={selectedVideo.channelTitle || 'Unknown'}
                        childId={childId}
                        recommendations={[...personalized, ...trending, ...educational].filter(v =>
                            (v.id?.videoId || v.videoId) !== selectedVideo.videoId
                        ).slice(0, 10).map(v => ({
                            videoId: v.id?.videoId || v.videoId,
                            title: v.snippet?.title || v.title,
                            thumbnail: v.snippet?.thumbnails?.medium?.url || v.thumbnail,
                            channelTitle: v.snippet?.channelTitle || v.channelTitle
                        }))}
                        onComplete={() => setSelectedVideo(null)}
                        onClose={() => setSelectedVideo(null)}
                        onPlayNext={(video) => {
                            setSelectedVideo({
                                videoId: video.videoId,
                                title: video.title,
                                channelTitle: video.channelTitle
                            });
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Avatar Editor Modal */}
            <AnimatePresence>
                {showAvatarEditor && (
                    <AvatarEditor
                        childId={childId}
                        onClose={() => setShowAvatarEditor(false)}
                    />
                )}
            </AnimatePresence>

            {/* Timer Overlay */}
            <ChildTimer childId={childId} />

            {/* Header */}
            <header className="sticky top-0 bg-white/80 backdrop-blur-md z-30 px-6 py-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-2xl shadow-inner border-2 border-yellow-200 cursor-pointer hover:scale-110 transition-transform"
                        onClick={() => navigate('/child/shop')}
                    >
                        {/* Avatar placeholder - click to edit */}
                        🐼
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-gray-800 tracking-tight">Hi {childName}!</h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">SafeGuard Kids</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <LevelProgressBar totalStarsEarned={totalStars || 0} />
                    <StarDisplay stars={stars || 0} />
                    <button
                        onClick={() => navigate('/child/requests')}
                        className="px-4 py-2 bg-blue-100 text-blue-600 rounded-xl font-bold hover:bg-blue-200 transition-colors"
                    >
                        My Requests
                    </button>
                    <button
                        onClick={() => navigate('/child/playlists')}
                        className="px-4 py-2 bg-pink-100 text-pink-600 rounded-xl font-bold hover:bg-pink-200 transition-colors"
                    >
                        My Playlists
                    </button>
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
                                <div key={i} className="space-y-3">
                                    <Skeleton variant="rectangular" height={192} className="w-full rounded-xl" />
                                    <div className="space-y-2">
                                        <Skeleton variant="text" width="80%" height={24} />
                                        <Skeleton variant="text" width="60%" height={16} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : videos.length > 0 ? (
                        /* Search Results */
                        <div>
                            <div className="flex items-center gap-3 mb-6 px-4">
                                <Search size={24} className="text-yellow-500" />
                                <h2 className="text-2xl font-black text-gray-800">Results for "{searchQuery}"</h2>
                            </div>
                            <VideoGrid videos={videos} onPlay={handleVideoClick} onAddToPlaylist={handleAddToPlaylist} childId={childId} />
                        </div>
                    ) : (
                        /* Dashboard Sections */
                        <div className="space-y-12">
                            {/* Daily Quests - Interactive Summary */}
                            <div onClick={() => navigate('/child/quests')} className="cursor-pointer transition-transform hover:scale-[1.01]">
                                <QuestLog childId={childId} />
                                <div className="text-center mt-2 text-indigo-600 font-bold hover:underline">View All Quests</div>
                            </div>

                            <Section
                                title="Just for You"
                                icon={<Sparkles className="text-purple-500" />}
                                color="from-purple-500 to-indigo-500"
                                videos={personalized}
                                onPlay={handleVideoClick}
                                onAddToPlaylist={handleAddToPlaylist}
                                childId={childId}
                            />
                            <Section
                                title="Trending Now"
                                icon={<TrendingUp className="text-orange-500" />}
                                color="from-orange-500 to-red-500"
                                videos={trending}
                                onPlay={handleVideoClick}
                                onAddToPlaylist={handleAddToPlaylist}
                                childId={childId}
                            />
                            <Section
                                title="Learn & Grow"
                                icon={<GraduationCap className="text-green-500" />}
                                color="from-green-500 to-emerald-500"
                                videos={educational}
                                onPlay={handleVideoClick}
                                onAddToPlaylist={handleAddToPlaylist}
                                childId={childId}
                            />

                            {/* Gamification Area */}
                            {!loading && !searchQuery && (
                                <div className="mt-12 cursor-pointer" onClick={() => navigate('/child/achievements')}>
                                    <BadgeShowcase badges={badges} />
                                    <div className="text-center mt-2 text-indigo-600 font-bold hover:underline">View All Achievements</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


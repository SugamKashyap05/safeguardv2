import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, Maximize, X, ChevronRight, SkipForward } from 'lucide-react';
import { api } from '../../services/api';
import clsx from 'clsx';

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

interface Video {
    videoId: string;
    title: string;
    thumbnail?: string;
    channelTitle?: string;
}

interface SafeVideoPlayerProps {
    videoId: string;
    videoTitle?: string;
    channelId?: string;
    channelName?: string;
    childId: string;
    recommendations?: Video[];
    onClose: () => void;
    onPlayNext?: (video: Video) => void;
    onComplete?: () => void;
}

export const SafeVideoPlayer: React.FC<SafeVideoPlayerProps> = ({
    videoId,
    videoTitle = 'Video',
    channelId = 'Unknown',
    channelName = 'Unknown',
    childId,
    recommendations = [],
    onClose,
    onPlayNext,
    onComplete
}) => {
    const playerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(100);
    const [currentTime, setCurrentTime] = useState(0);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [showSidebar, setShowSidebar] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        // 1. Start Session Request
        const startSession = async () => {
            try {
                const res = await api.post('/watch/start', {
                    childId,
                    videoId,
                    videoTitle,
                    channelId,
                    channelName
                });
                setSessionId(res.data.data?.id || res.data.data?.sessionId);
                initPlayer();
            } catch (err) {
                console.error('Session blocked', err);
                alert("Time's up or content blocked!");
                onClose();
            }
        };
        startSession();

        // Cleanup
        return () => {
            if (playerRef.current) {
                playerRef.current.destroy();
            }
        };
    }, [videoId]);

    // Handle fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
            setShowSidebar(!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const initPlayer = () => {
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
            window.onYouTubeIframeAPIReady = loadPlayer;
        } else {
            loadPlayer();
        }
    };

    const loadPlayer = () => {
        playerRef.current = new window.YT.Player('safe-player-frame', {
            height: '100%',
            width: '100%',
            videoId: videoId,
            playerVars: {
                controls: 0,
                disablekb: 1,
                modestbranding: 1,
                rel: 0,
                showinfo: 0,
                iv_load_policy: 3,
                fs: 0
            },
            events: {
                onReady: (event: any) => {
                    setDuration(event.target.getDuration());
                    event.target.playVideo();
                    setIsPlaying(true);
                },
                onStateChange: (event: any) => {
                    setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
                    if (event.data === window.YT.PlayerState.ENDED) {
                        if (onComplete) onComplete();
                        if (sessionId) api.post(`/watch/${sessionId}/complete`);
                    }
                }
            }
        });
    };

    // Progress Loop
    useEffect(() => {
        const interval = setInterval(() => {
            if (playerRef.current && isPlaying) {
                const curr = playerRef.current.getCurrentTime();
                const dur = playerRef.current.getDuration();
                setCurrentTime(curr);
                setDuration(dur);
                setProgress((curr / dur) * 100);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [isPlaying]);

    // Refs for Heartbeat (to avoid effect re-creation)
    const currentTimeRef = useRef(0);
    const durationRef = useRef(0);
    const isPlayingRef = useRef(false);
    const sessionIdRef = useRef<string | null>(null);

    // Update refs whenever state changes
    useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);
    useEffect(() => { durationRef.current = duration; }, [duration]);
    useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
    useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);

    // Backend Sync (Heartbeat) - Fixed: No dependency on changing values
    useEffect(() => {
        const sync = setInterval(() => {
            if (sessionIdRef.current && isPlayingRef.current) {
                api.patch(`/watch/${sessionIdRef.current}/update`, {
                    watchedDuration: Math.floor(currentTimeRef.current),
                    duration: Math.floor(durationRef.current)
                }).catch(err => console.error('Heartbeat failed', err));
            }
        }, 10000); // 10s heartbeat
        return () => clearInterval(sync);
    }, []); // Empty dependency array = runs once on mount/unmount logic
    // Actually safe to just run once, or restart if session changes? 
    // Session changes only on new video. 
    // Let's rely on refs. If video changes, refs update. 
    // But we might want to clear interval on unmount. Yes.

    // Wait, if video changes, component might remount? 
    // SafeVideoPlayer is unmounted/remounted when `selectedVideo` changes in parent?
    // Parent: {selectedVideo && <SafeVideoPlayer ... key={selectedVideo.id} />} 
    // Usage in ChildDashboardPage doesn't have key explicit, but conditional rendering implies remount if null->obj.
    // If just switching obj->obj, React might reuse. 
    // Let's add [videoId] to dependency just in case to restart interval on new video.

    const togglePlay = () => {
        if (isPlaying) playerRef.current.pauseVideo();
        else playerRef.current.playVideo();
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        const newTime = (val / 100) * duration;
        playerRef.current.seekTo(newTime, true);
        setProgress(val);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = Math.floor(s % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handlePlayNext = (video: Video) => {
        if (onPlayNext) {
            onPlayNext(video);
        }
    };

    return (
        <div ref={containerRef} className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
            {/* Top Navigation Header - Always Visible */}
            <div className="bg-gray-900/95 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between z-20">
                <button
                    onClick={onClose}
                    className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
                >
                    <X size={24} />
                    <span className="font-medium">Close</span>
                </button>
                <h2 className="text-white font-bold text-lg truncate max-w-md">{videoTitle}</h2>
                <button
                    onClick={() => setShowSidebar(!showSidebar)}
                    className={clsx(
                        "text-white hover:text-gray-300 transition-colors",
                        isFullscreen && "hidden"
                    )}
                >
                    <ChevronRight size={24} className={clsx("transition-transform", showSidebar && "rotate-180")} />
                </button>
            </div>

            <div className="flex flex-1 min-h-0">
                {/* Main Video Area */}
                <div className={clsx("flex-1 flex flex-col relative", showSidebar && !isFullscreen ? "w-[70%]" : "w-full")}>
                    {/* Video Frame */}
                    <div className="flex-1 relative">
                        <div className="absolute inset-0 pointer-events-none">
                            <div id="safe-player-frame" className="w-full h-full" />
                        </div>
                        <div className="absolute inset-0 bg-transparent pointer-events-auto" onClick={togglePlay} />
                    </div>

                    {/* Custom Controls Bar */}
                    <div className="bg-gradient-to-r from-blue-500/90 to-purple-600/90 backdrop-blur-xl p-4 flex items-center gap-4 border-t border-white/20">
                        <button
                            onClick={togglePlay}
                            className="w-12 h-12 bg-white text-blue-600 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform flex-shrink-0"
                        >
                            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                        </button>

                        <div className="flex-1 flex flex-col gap-1">
                            <div className="flex justify-between text-xs font-bold text-white/80 px-1">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={progress}
                                onChange={handleSeek}
                                className="w-full h-2 bg-black/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md"
                            />
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="flex items-center gap-2 text-white">
                                <Volume2 size={18} />
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={volume}
                                    onChange={(e) => {
                                        setVolume(Number(e.target.value));
                                        playerRef.current.setVolume(Number(e.target.value));
                                    }}
                                    className="w-16 h-1.5 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                                />
                            </div>

                            <div className="w-px h-6 bg-white/20" />

                            <button onClick={toggleFullscreen} className="text-white hover:text-blue-100 transition-colors">
                                <Maximize size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Recommendations Sidebar */}
                {showSidebar && !isFullscreen && (
                    <div className="w-[30%] bg-gray-800 border-l border-white/10 flex flex-col min-w-[280px] max-w-[400px]">
                        <div className="p-4 border-b border-white/10">
                            <h3 className="text-white font-bold text-lg">Up Next</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-3">
                            {recommendations.length > 0 ? (
                                recommendations.slice(0, 10).map((video, idx) => (
                                    <button
                                        key={video.videoId + idx}
                                        onClick={() => handlePlayNext(video)}
                                        className="w-full flex gap-3 p-2 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition-colors group"
                                    >
                                        <div className="w-24 h-16 bg-gray-600 rounded-lg flex-shrink-0 overflow-hidden relative">
                                            {video.thumbnail ? (
                                                <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <Play size={20} />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <SkipForward className="text-white" size={20} />
                                            </div>
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <p className="text-white text-sm font-medium line-clamp-2">{video.title}</p>
                                            <p className="text-gray-400 text-xs mt-1">{video.channelTitle || 'Unknown Channel'}</p>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="text-gray-400 text-center py-8">
                                    <p>No recommendations available</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

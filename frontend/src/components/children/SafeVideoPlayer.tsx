import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, Maximize, X, VolumeX } from 'lucide-react';
import { api } from '../../services/api';

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

interface SafeVideoPlayerProps {
    videoId: string;
    childId: string;
    onClose: () => void;
    onComplete?: () => void;
}

export const SafeVideoPlayer: React.FC<SafeVideoPlayerProps> = ({ videoId, childId, onClose, onComplete }) => {
    const playerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(100);
    const [currentTime, setCurrentTime] = useState(0);
    const [sessionId, setSessionId] = useState<string | null>(null);

    useEffect(() => {
        // 1. Start Session Request
        const startSession = async () => {
            try {
                const res = await api.post('/watch/session/start', {
                    childId,
                    videoId,
                    videoTitle: 'Unknown', // Ideally passed in props
                    channelId: 'Unknown'
                });
                setSessionId(res.data.data.sessionId);
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
                controls: 0, // Custom controls
                disablekb: 1,
                modestbranding: 1,
                rel: 0,
                showinfo: 0,
                iv_load_policy: 3, // No annotations
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

                // Sync with backend every 30s?
                // implemented in separate useEffect or just here modulo
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [isPlaying]);

    // Backend Sync
    useEffect(() => {
        const sync = setInterval(() => {
            if (sessionId && isPlaying) {
                api.patch(`/watch/${sessionId}/update`, {
                    watchedDuration: Math.floor(currentTime),
                    duration: Math.floor(duration)
                });
            }
        }, 30000); // 30s
        return () => clearInterval(sync);
    }, [sessionId, isPlaying, currentTime]);

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

    return (
        <div ref={containerRef} className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
            {/* Close Button (Top Right) */}
            {!document.fullscreenElement && (
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-20 bg-white/10 hover:bg-white/20 p-3 rounded-full text-white backdrop-blur-md"
                >
                    <X size={24} />
                </button>
            )}

            {/* Video Frame */}
            <div className="w-full h-full relative pointer-events-none">
                {/* Pointer events none prevents direct interaction with YT iframe, forcing use of our controls */}
                <div id="safe-player-frame" className="w-full h-full" />
                <div className="absolute inset-0 bg-transparent pointer-events-auto" onClick={togglePlay} />
                {/* Transparent overlay to capture clicks for play/pause if desired, or let clicks pass through if we want YT behavior (but we disabled controls) */}
            </div>

            {/* Custom Controls Bar */}
            <div className="absolute bottom-6 left-6 right-6 bg-gradient-to-r from-blue-500/90 to-purple-600/90 backdrop-blur-xl rounded-3xl p-4 flex items-center gap-6 shadow-2xl border border-white/20">

                <button
                    onClick={togglePlay}
                    className="w-14 h-14 bg-white text-blue-600 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                >
                    {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
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
                        className="w-full h-3 bg-black/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-white">
                        <Volume2 size={20} />
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={volume}
                            onChange={(e) => {
                                setVolume(Number(e.target.value));
                                playerRef.current.setVolume(Number(e.target.value));
                            }}
                            className="w-20 h-1.5 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                        />
                    </div>

                    <div className="w-px h-8 bg-white/20" />

                    <button onClick={toggleFullscreen} className="text-white hover:text-blue-100 transition-colors">
                        <Maximize size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
};

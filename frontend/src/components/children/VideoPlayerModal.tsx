import React, { useState, useEffect } from 'react';
import { X, Lock, Play, ThumbsUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';

interface VideoPlayerModalProps {
    video: any;
    childId: string;
    onClose: () => void;
}

export const VideoPlayerModal = ({ video, childId, onClose }: VideoPlayerModalProps) => {
    const [status, setStatus] = useState<'checking' | 'allowed' | 'blocked'>('checking');
    const [blockReason, setBlockReason] = useState('');
    const [requestSent, setRequestSent] = useState(false);

    useEffect(() => {
        checkPermission();
    }, [video]);

    const checkPermission = async () => {
        try {
            // Validate via backend
            const res = await api.post('/filters/check-video', {
                childId,
                video: {
                    videoId: video.id.videoId,
                    title: video.snippet.title,
                    channelId: video.snippet.channelId,
                    channelTitle: video.snippet.channelTitle,
                    description: video.snippet.description
                }
            });

            if (res.data.data.allowed) {
                setStatus('allowed');
                // Log start watch
                api.post('/watch/start', {
                    childId,
                    videoId: video.id.videoId,
                    videoTitle: video.snippet.title,
                    channelId: video.snippet.channelId,
                    channelName: video.snippet.channelTitle,
                    thumbnail: video.snippet.thumbnails.high.url
                });
            } else {
                setStatus('blocked');
                setBlockReason(res.data.data.reason || 'Content not allowed');
                // Log block
                api.post('/watch/block-log', { childId, videoId: video.id.videoId, reason: res.data.data.reason });
                // Note: block-log endpoint might need to be created or use generic log
            }
        } catch (err) {
            console.error('Check failed', err);
            // Fail safe: Block? or Allow? SafeGuard should probably Block.
            setStatus('blocked');
            setBlockReason('Connection failed');
        }
    };

    const handleRequestApproval = async () => {
        try {
            await api.post('/channels/request', {
                childId,
                channelId: video.snippet.channelId,
                channelName: video.snippet.channelTitle,
                thumbnailUrl: video.snippet.thumbnails.default.url
            });
            setRequestSent(true);
        } catch (err) {
            console.error(err);
            alert('Could not send request');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/50 hover:text-white p-2"
            >
                <X size={32} />
            </button>

            <div className="w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden relative shadow-2xl border border-white/10">
                {status === 'checking' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                        <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="font-bold">Checking if this is safe...</p>
                    </div>
                )}

                {status === 'allowed' && (
                    <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${video.id.videoId}?autoplay=1&modestbranding=1&rel=0`}
                        title="Video Player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                )}

                {status === 'blocked' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-8 bg-gray-900">
                        <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6 text-red-400">
                            <Lock size={48} />
                        </div>
                        <h2 className="text-3xl font-bold mb-2">This video is locked</h2>
                        <p className="text-gray-400 mb-8 max-w-md">
                            {blockReason}.<br />
                            Ask your parent to approve the channel <strong>{video.snippet.channelTitle}</strong>?
                        </p>

                        {!requestSent ? (
                            <button
                                onClick={handleRequestApproval}
                                className="px-8 py-4 bg-yellow-400 text-yellow-900 rounded-2xl font-black text-xl hover:bg-yellow-300 transform hover:scale-105 transition-all flex items-center gap-3"
                            >
                                <ThumbsUp size={24} /> Ask Parent
                            </button>
                        ) : (
                            <div className="px-8 py-4 bg-green-500/20 text-green-400 rounded-2xl font-bold text-xl border border-green-500/50 flex items-center gap-3">
                                <Check size={24} /> Request Sent!
                            </div>
                        )}

                        <button onClick={onClose} className="mt-8 text-white/50 hover:text-white font-bold text-sm">
                            Go Back
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// Helper icon
const Check = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

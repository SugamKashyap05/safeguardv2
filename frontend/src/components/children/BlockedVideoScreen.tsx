import { useState } from 'react';
import { Lock, MessageCircle, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';

interface BlockedVideoScreenProps {
    videoId: string;
    videoTitle: string;
    videoThumbnail: string;
    channelId: string;
    channelName: string;
    duration?: number;
    onBack: () => void;
    onRequestSent?: () => void;
}

export const BlockedVideoScreen = ({
    videoId,
    videoTitle,
    videoThumbnail,
    channelId,
    channelName,
    duration,
    onBack,
    onRequestSent
}: BlockedVideoScreenProps) => {
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [requestSent, setRequestSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRequestApproval = async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            await api.post('/approvals/request', {
                videoId,
                videoTitle,
                videoThumbnail,
                channelId,
                channelName,
                duration,
                message: message.trim() || undefined,
                requestType: 'video'
            });

            setRequestSent(true);
            onRequestSent?.();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send request');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (requestSent) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="fixed inset-0 bg-gradient-to-br from-green-500 to-emerald-600 flex flex-col items-center justify-center p-8 text-white text-center z-50"
            >
                <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                >
                    <CheckCircle size={80} className="mb-6" />
                </motion.div>
                <h1 className="text-3xl font-bold mb-4">Request Sent! 📨</h1>
                <p className="text-xl opacity-90 mb-8 max-w-md">
                    Your parent will get a notification. They'll let you know when they decide!
                </p>
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-2xl font-bold transition-colors"
                >
                    <ArrowLeft size={20} />
                    Watch Something Else
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-gradient-to-br from-red-500 to-orange-500 flex flex-col items-center justify-center p-8 text-white z-50"
        >
            {/* Lock Icon */}
            <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="mb-6"
            >
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                    <Lock size={48} />
                </div>
            </motion.div>

            <h1 className="text-3xl font-bold mb-2">Oops!</h1>
            <p className="text-xl opacity-90 mb-8">This video needs parent approval</p>

            {/* Video Preview */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-6 max-w-md w-full">
                <div className="flex gap-4">
                    <img
                        src={videoThumbnail}
                        alt={videoTitle}
                        className="w-32 h-20 object-cover rounded-lg bg-black/20"
                    />
                    <div className="flex-1 text-left">
                        <h3 className="font-bold line-clamp-2 text-sm">{videoTitle}</h3>
                        <p className="text-white/70 text-sm mt-1">{channelName}</p>
                    </div>
                </div>
            </div>

            {/* Message Input */}
            <div className="w-full max-w-md mb-6">
                <div className="flex items-center gap-2 mb-2 text-white/80">
                    <MessageCircle size={16} />
                    <span className="text-sm">Add a message (optional)</span>
                </div>
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Please can I watch this? 🙏"
                    maxLength={200}
                    className="w-full p-4 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-white/50"
                    rows={2}
                />
                <p className="text-right text-xs text-white/50 mt-1">{message.length}/200</p>
            </div>

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-white/20 text-white px-4 py-2 rounded-lg mb-4 text-sm"
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex flex-col gap-3 w-full max-w-md">
                <button
                    onClick={handleRequestApproval}
                    disabled={isSubmitting}
                    className="w-full py-4 bg-white text-red-600 font-bold rounded-2xl hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            Sending...
                        </>
                    ) : (
                        'Ask Parent to Approve'
                    )}
                </button>

                <button
                    onClick={onBack}
                    className="w-full py-3 bg-white/20 hover:bg-white/30 font-bold rounded-2xl transition-colors"
                >
                    Choose Different Video
                </button>
            </div>
        </motion.div>
    );
};

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Heart, ListPlus, Check } from 'lucide-react';
import clsx from 'clsx';
import { PlaylistService } from '../../services/playlist.service';

interface VideoCardProps {
    video: any;
    onPlay: (video: any) => void;
    onAddToPlaylist: (video: any) => void;
    childId: string;
}

export const VideoCard = ({ video, onPlay, onAddToPlaylist, childId }: VideoCardProps) => {
    const [isFavorite, setIsFavorite] = useState(false);
    const [loadingFav, setLoadingFav] = useState(false);

    const title = video.snippet?.title || video.title;
    const channelTitle = video.snippet?.channelTitle || video.channelTitle;
    const thumbnail = video.snippet?.thumbnails?.high?.url || video.thumbnail || video.snippet?.thumbnails?.default?.url;
    const videoId = video.id?.videoId || video.videoId;

    useEffect(() => {
        checkFavoriteStatus();
    }, [videoId]);

    const checkFavoriteStatus = async () => {
        if (!childId || !videoId) return;
        try {
            const status = await PlaylistService.checkFavorite(childId, videoId);
            setIsFavorite(status);
        } catch (err) {
            console.error("Failed to check favorite", err);
        }
    };

    const handleToggleFavorite = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (loadingFav) return;
        setLoadingFav(true);
        try {
            const newState = await PlaylistService.toggleFavorite(childId, videoId, {
                title, thumbnail, channelTitle
            });
            setIsFavorite(newState);
        } catch (err) {
            console.error("Failed to toggle favorite", err);
        } finally {
            setLoadingFav(false);
        }
    };

    const handleAddClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onAddToPlaylist({
            id: videoId,
            title,
            thumbnail,
            channelTitle
        });
    };

    return (
        <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white rounded-3xl overflow-hidden shadow-xl shadow-gray-100/50 border border-gray-50 cursor-pointer group h-full flex flex-col relative"
            onClick={() => onPlay(video)}
        >
            <div className="aspect-video relative overflow-hidden bg-gray-100">
                <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 bg-white/90 text-black rounded-full flex items-center justify-center shadow-xl">
                        <Play size={24} fill="currentColor" className="ml-1" />
                    </div>
                </div>

                {/* Action Buttons (Visible on Hover or if active) */}
                <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                        onClick={handleToggleFavorite}
                        className={clsx(
                            "p-2 rounded-full backdrop-blur-md shadow-sm transition-all hover:scale-110",
                            isFavorite ? "bg-pink-500 text-white" : "bg-black/40 text-white hover:bg-pink-500"
                        )}
                    >
                        <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
                    </button>
                    <button
                        onClick={handleAddClick}
                        className="p-2 bg-black/40 hover:bg-blue-500 text-white rounded-full backdrop-blur-md shadow-sm transition-all hover:scale-110"
                    >
                        <ListPlus size={18} />
                    </button>
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

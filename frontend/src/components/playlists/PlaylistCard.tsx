
import { Playlist } from '../../types/playlist';
import { Play, ListVideo } from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

interface PlaylistCardProps {
    playlist: Playlist;
    onClick?: () => void;
    large?: boolean;
    basePath?: string;
}

export const PlaylistCard = ({ playlist, onClick, large = false, basePath = '/child/playlists' }: PlaylistCardProps) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (onClick) onClick();
        else navigate(`${basePath}/${playlist.id}`);
    };

    const gradient = playlist.type === 'favorites'
        ? 'from-pink-400 to-rose-500'
        : playlist.type === 'watch_later'
            ? 'from-blue-400 to-indigo-500'
            : 'from-amber-300 to-orange-400';

    return (
        <div
            onClick={handleClick}
            className={clsx(
                "group relative rounded-3xl overflow-hidden cursor-pointer shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 bg-white",
                large ? "aspect-[16/9]" : "aspect-square"
            )}
        >
            {/* Thumbnail */}
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                {playlist.thumbnail ? (
                    <img src={playlist.thumbnail} alt={playlist.name} className="w-full h-full object-cover" />
                ) : (
                    <div className={clsx("w-full h-full bg-gradient-to-br flex items-center justify-center", gradient)}>
                        <ListVideo className="text-white w-1/3 h-1/3 opacity-50" />
                    </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="bg-white/20 backdrop-blur-md rounded-full p-4 transform scale-90 opacity-0 group-hover:scale-110 group-hover:opacity-100 transition-all">
                        <Play fill="white" className="text-white w-8 h-8 md:w-12 md:h-12 translate-x-1" />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent pt-12 text-white">
                <h3 className={clsx("font-bold leading-tight", large ? "text-2xl" : "text-lg")}>
                    {playlist.name}
                </h3>
                <div className="flex items-center gap-2 text-xs md:text-sm text-white/80 mt-1">
                    <span className="bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                        {playlist.item_count || 0} videos
                    </span>
                    {playlist.type === 'favorites' && <span>♥ Favorites</span>}
                </div>
            </div>
        </div>
    );
};

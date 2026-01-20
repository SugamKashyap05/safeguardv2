import { useEffect, useState } from 'react';
import { X, Plus, Clock, List } from 'lucide-react';
import { Playlist } from '../../types/playlist';
import { PlaylistService } from '../../services/playlist.service';
import clsx from 'clsx';

interface AddToPlaylistModalProps {
    isOpen: boolean;
    onClose: () => void;
    video: {
        id: string;
        title: string;
        thumbnail: string;
        channelTitle: string;
    };
    childId: string;
}

export const AddToPlaylistModal = ({ isOpen, onClose, video, childId }: AddToPlaylistModalProps) => {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && childId) {
            loadPlaylists();
        }
    }, [isOpen, childId]);

    const loadPlaylists = async () => {
        try {
            const data = await PlaylistService.getPlaylists(childId);
            // Filter out 'favorites' as checking/unchecking logic is complex for this simple list, usually handled by heart button.
            // But user might want to add to favorites here too. Let's keep it but maybe show it differently.
            setPlaylists(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreate = async () => {
        const name = prompt("Name your new playlist:");
        if (!name) return;
        try {
            await PlaylistService.createPlaylist({ childId, name });
            loadPlaylists();
        } catch (err) {
            console.error(err);
        }
    };

    const handleToggle = async (playlist: Playlist) => {
        // We need to know if it's already in the playlist to toggle correctly.
        // For now, this modal is "Add To", so we just try to add.
        // Improvements: fetch membership status for all playlists.

        try {
            setLoading(true);
            await PlaylistService.addToPlaylist(playlist.id, video.id, {
                title: video.title,
                thumbnail: video.thumbnail,
                channelTitle: video.channelTitle
            });
            alert(`Added to ${playlist.name}`);
            onClose();
        } catch (err: any) {
            if (err.response?.status === 400 || err.message?.includes('already')) {
                alert("Already in this playlist!");
            } else {
                console.error(err);
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800">Save to...</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
                    {playlists.map(pl => (
                        <button
                            key={pl.id}
                            onClick={() => handleToggle(pl)}
                            disabled={loading}
                            className={clsx(
                                "w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left",
                                "hover:bg-gray-50 active:bg-gray-100 border border-transparent hover:border-gray-200",
                                pl.type === 'favorites' && "bg-pink-50 hover:bg-pink-100 text-pink-900",
                            )}
                        >
                            <div className={clsx(
                                "w-12 h-12 rounded-lg flex items-center justify-center text-xl shrink-0",
                                pl.type === 'favorites' ? "bg-white" : "bg-gray-200"
                            )}>
                                {pl.type === 'favorites' ? '♥' : (pl.type === 'watch_later' ? <Clock size={20} /> : <List size={20} />)}
                            </div>
                            <div>
                                <div className="font-bold">{pl.name}</div>
                                <div className="text-xs opacity-60">{pl.item_count} videos</div>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <button
                        onClick={handleCreate}
                        className="w-full py-3 px-4 bg-white border-2 border-dashed border-gray-300 rounded-xl font-bold text-gray-500 hover:text-gray-800 hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={20} /> Create New Playlist
                    </button>
                </div>
            </div>
        </div>
    );
};

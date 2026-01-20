import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Playlist, PlaylistItem } from '../../types/playlist';
import { PlaylistService } from '../../services/playlist.service';
import { Play, ArrowLeft, Trash2, Clock } from 'lucide-react';
import clsx from 'clsx';

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableVideoItem } from '../../components/playlists/SortableVideoItem';

export const PlaylistDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const isParentView = location.pathname.includes('/parent/');
    const [playlist, setPlaylist] = useState<Playlist | null>(null);
    const [items, setItems] = useState<PlaylistItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (id) loadPlaylist(id);
    }, [id]);

    const loadPlaylist = async (playlistId: string) => {
        try {
            const data = await PlaylistService.getPlaylistById(playlistId);
            setPlaylist(data);
            setItems(data.items || []);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!playlist || playlist.is_default) return;
        if (confirm(`Delete playlist "${playlist.name}"?`)) {
            await PlaylistService.deletePlaylist(playlist.id);
            const backPath = isParentView ? `/parent/child/${playlist.child_id}/playlists` : '/child/playlists';
            navigate(backPath);
        }
    };

    const handleRemoveVideo = async (videoId: string) => {
        if (!playlist) return;
        if (confirm("Remove video from playlist?")) {
            await PlaylistService.removeFromPlaylist(playlist.id, videoId);
            loadPlaylist(playlist.id);
        }
    };

    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setItems((currentItems) => {
                const oldIndex = currentItems.findIndex((item) => item.id === active.id);
                const newIndex = currentItems.findIndex((item) => item.id === over.id);
                const reordered = arrayMove(currentItems, oldIndex, newIndex);

                // Save new order to backend
                if (playlist) {
                    PlaylistService.reorderItems(playlist.id, reordered.map(item => item.id))
                        .catch(err => console.error('Failed to save order:', err));
                }

                return reordered;
            });
        }
    }, [playlist]);

    if (isLoading) return <div className="p-8">Loading...</div>;
    if (!playlist) return <div className="p-8">Playlist not found</div>;

    const topGradient = playlist.type === 'favorites'
        ? 'from-pink-100 to-rose-200'
        : 'from-amber-100 to-orange-200';

    return (
        <div className="min-h-screen bg-[#FFFDF5]">
            {/* Header */}
            <div className={clsx("bg-gradient-to-b pb-12 pt-8 px-8", topGradient)}>
                <button
                    onClick={() => {
                        const backPath = isParentView && playlist ? `/parent/child/${playlist.child_id}/playlists` : '/child/playlists';
                        navigate(backPath);
                    }}
                    className="flex items-center gap-2 font-bold opacity-60 hover:opacity-100 mb-8 transition-opacity"
                >
                    <ArrowLeft size={20} /> Back to Playlists
                </button>

                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Cover Art */}
                    <div className="w-64 aspect-square rounded-3xl shadow-xl overflow-hidden bg-white relative flex-shrink-0">
                        {playlist.thumbnail ? (
                            <img src={playlist.thumbnail} className="w-full h-full object-cover" alt="" />
                        ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-4xl">🎵</div>
                        )}
                    </div>

                    {/* Metadata */}
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">{playlist.name}</h1>
                                {playlist.description && <p className="text-gray-700 text-lg mb-4">{playlist.description}</p>}
                            </div>
                            {!playlist.is_default && (
                                <button onClick={handleDelete} className="p-3 bg-white/50 hover:bg-white text-red-500 rounded-full transition-colors">
                                    <Trash2 size={24} />
                                </button>
                            )}
                        </div>

                        <div className="flex gap-4 mb-8 text-sm font-bold text-gray-600">
                            <span className="bg-white/40 px-3 py-1 rounded-full">{items.length} videos</span>
                            <span className="flex items-center gap-1"><Clock size={16} /> Updated {new Date(playlist.updated_at).toLocaleDateString()}</span>
                        </div>

                        <button className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 px-8 rounded-full shadow-lg flex items-center gap-3 transform hover:scale-105 transition-all">
                            <Play fill="white" /> Play All
                        </button>
                    </div>
                </div>
            </div>

            {/* Sortable List */}
            <div className="max-w-5xl mx-auto p-4 md:p-8 -mt-8">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-2 md:p-6 space-y-2">
                    {items.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            No videos yet. Go watch something awesome!
                        </div>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={items.map(item => item.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {items.map((item, index) => (
                                    <SortableVideoItem
                                        key={item.id}
                                        item={item}
                                        index={index}
                                        onRemove={handleRemoveVideo}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    )}
                </div>
            </div>
        </div>
    );
};

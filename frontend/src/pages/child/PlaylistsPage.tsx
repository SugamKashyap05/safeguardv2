import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Playlist } from '../../types/playlist';
import { PlaylistService } from '../../services/playlist.service';
import { PlaylistCard } from '../../components/playlists/PlaylistCard';
import { Plus, ListMusic } from 'lucide-react';
// import { CreatePlaylistModal } from '../../components/playlists/CreatePlaylistModal'; // Implement later if needed

export const PlaylistsPage = () => {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { childId: paramChildId } = useParams<{ childId: string }>();
    const location = useLocation();

    // Determine context (Child or Parent)
    const isParentView = location.pathname.includes('/parent/');
    const childId = paramChildId || localStorage.getItem('activeChildId');
    const basePath = isParentView ? `/parent/child/${childId}/playlists` : '/child/playlists';

    useEffect(() => {
        if (childId) {
            loadPlaylists(childId);
        }
    }, [childId]);

    const loadPlaylists = async (id: string) => {
        try {
            const data = await PlaylistService.getPlaylists(id);
            setPlaylists(data);
        } catch (err) {
            console.error("Failed to load playlists", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        const name = prompt("Name your new playlist:");
        if (!name || !childId) return;

        try {
            await PlaylistService.createPlaylist({ childId, name });
            loadPlaylists(childId);
        } catch (err) {
            alert("Failed to create playlist");
        }
    };

    const defaults = playlists.filter(p => p.is_default);
    const customs = playlists.filter(p => !p.is_default);

    return (
        <div className="min-h-screen bg-[#FFFDF5] p-6 pb-24 md:p-8">
            <header className="mb-8">
                <h1 className="text-4xl font-extrabold text-gray-800 flex items-center gap-3">
                    <span className="bg-yellow-100 p-2 rounded-2xl text-yellow-500">
                        <ListMusic size={32} />
                    </span>
                    My Playlists
                </h1>
            </header>

            {isLoading ? (
                <div className="flex justify-center py-20">Loading...</div>
            ) : (
                <div className="space-y-12">
                    {/* Default Playlists */}
                    <section>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {defaults.map(pl => (
                                <PlaylistCard key={pl.id} playlist={pl} large basePath={basePath} />
                            ))}
                        </div>
                    </section>

                    {/* Custom Playlists */}
                    <section>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">My Collections</h2>
                            <button
                                onClick={handleCreate}
                                className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold px-4 py-2 rounded-full transition-colors shadow-sm"
                            >
                                <Plus size={20} />
                                New Playlist
                            </button>
                        </div>

                        {customs.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                <p className="text-gray-500 font-medium">No custom playlists yet.</p>
                                <button onClick={handleCreate} className="text-yellow-600 font-bold hover:underline mt-2">
                                    Create one now?
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {customs.map(pl => (
                                    <PlaylistCard key={pl.id} playlist={pl} basePath={basePath} />
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            )}
        </div>
    );
};


import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChildService } from '../../services/auth.service';
import { ChildCard } from '../../components/children/ChildCard';
import { AddChildModal } from '../../components/children/AddChildModal';
import { Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChildDevicesList } from '../../components/dashboard/ChildDevicesList';

export const ChildManagementPage = () => {
    const navigate = useNavigate();
    const [children, setChildren] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [managingChild, setManagingChild] = useState<any | null>(null);

    const loadChildren = async () => {
        setIsLoading(true);
        try {
            const res = await ChildService.getAll();
            if (res.success) {
                setChildren(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadChildren();
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">My Adventurers</h1>
                    <p className="text-gray-500">Manage profiles and screen time settings</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-6 py-3 rounded-xl font-bold shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                    <Plus size={20} /> Add Child
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {children.map(child => (
                    <ChildCard
                        key={child.id}
                        child={child}
                        onEdit={(c) => navigate(`/parent/child/${c.id}/manage`)}
                        onTogglePause={(c) => console.log('Pause', c)}
                        onViewActivity={(id) => console.log('Activity', id)}
                        onManageChannels={(id) => navigate(`/parent/channels/${id}`)}
                        onManageDevices={(c) => setManagingChild(c)}
                        onManagePlaylists={(c) => navigate(`/parent/child/${c.id}/playlists`)}
                    />
                ))}

                {/* Empty State / Add Placeholder */}
                {children.length === 0 && !isLoading && (
                    <div className="col-span-full py-20 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl">
                        <p>No children added yet. Start your family journey!</p>
                    </div>
                )}
            </div>

            <AddChildModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onRefresh={loadChildren}
            />

            {/* Device Management Modal */}
            <AnimatePresence>
                {managingChild && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setManagingChild(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setManagingChild(null)}
                                className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <h2 className="text-2xl font-bold text-gray-800 mb-1">{managingChild.name}'s Devices</h2>
                            <p className="text-gray-500 mb-6 text-sm">Manage connected devices and sessions</p>

                            <ChildDevicesList childId={managingChild.id} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

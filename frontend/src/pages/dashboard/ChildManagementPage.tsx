import React, { useEffect, useState } from 'react';
import { ChildService } from '../../services/auth.service';
import { ChildCard } from '../../components/children/ChildCard';
import { AddChildModal } from '../../components/children/AddChildModal';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export const ChildManagementPage = () => {
    const [children, setChildren] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

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
                        onEdit={(c) => console.log('Edit', c)}
                        onTogglePause={(c) => console.log('Pause', c)}
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
        </div>
    );
};

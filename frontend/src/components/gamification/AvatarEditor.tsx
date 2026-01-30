
import React, { useEffect, useState } from 'react';
import { gamificationService } from '../../services/gamification.service';
import { motion } from 'framer-motion';
import { useGamification } from '../../contexts/GamificationContext';

// Types derived from backend logic
interface ShopItem {
    id: string;
    type: 'hat' | 'glasses' | 'skin' | 'background';
    name: string;
    price: number;
    icon: string;
}

interface AvatarConfig {
    [key: string]: string | undefined;
    hat?: string;
    glasses?: string;
    skin?: string;
}

interface AvatarEditorProps {
    childId: string;
    onClose: () => void;
    isPage?: boolean;
}

export const AvatarEditor: React.FC<AvatarEditorProps> = ({ childId, onClose, isPage = false }) => {
    const { stars, setStars } = useGamification();
    const [items, setItems] = useState<ShopItem[]>([]);
    const [inventory, setInventory] = useState<string[]>([]);
    const [config, setConfig] = useState<AvatarConfig>({});
    const [activeTab, setActiveTab] = useState<'hat' | 'glasses' | 'skin'>('skin');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [shopData, invData] = await Promise.all([
                gamificationService.getShopItems(),
                gamificationService.getInventory(childId)
            ]);
            setItems(shopData);
            setInventory(invData);
            // Ideally load current config too, but for now defaults.
        } catch (e) {
            console.error(e);
        }
    };

    const handleBuy = async (item: ShopItem) => {
        if (stars < item.price) {
            alert("Not enough stars!");
            return;
        }
        if (confirm(`Buy ${item.name} for ${item.price} ⭐?`)) {
            try {
                const res = await gamificationService.buyItem(childId, item.id);
                if (res.status === 'success') {
                    setStars(res.data.newBalance); // Update context
                    setInventory([...inventory, item.id]);
                    // Auto-equip
                    setConfig({ ...config, [item.type]: item.id });
                }
            } catch (e) {
                alert("Purchase failed!");
            }
        }
    };

    const handleEquip = (item: ShopItem) => {
        setConfig({ ...config, [item.type]: item.id });
    };

    const handleSave = async () => {
        try {
            await gamificationService.saveAvatar(childId, config);
            onClose();
        } catch (e) { console.error(e); }
    };

    const filteredItems = items.filter(i => i.type === activeTab);

    // Placeholder Avatar Render
    const AvatarPreview = () => (
        <div className="w-48 h-48 bg-gray-100 rounded-full flex items-center justify-center relative border-4 border-white shadow-lg text-8xl overflow-hidden">
            {/* Base Skin */}
            <div className="z-10">
                {items.find(i => i.id === (config.skin || 'skin_panda'))?.icon || '🐼'}
            </div>

            {/* Hat Overlay */}
            {config.hat && (
                <div className="absolute top-0 z-20 text-6xl mt-2">
                    {items.find(i => i.id === config.hat)?.icon}
                </div>
            )}

            {/* Glasses Overlay */}
            {config.glasses && (
                <div className="absolute top-12 z-20 text-5xl">
                    {items.find(i => i.id === config.glasses)?.icon}
                </div>
            )}
        </div>
    );

    const content = (
        <div className={`bg-white w-full ${isPage ? 'h-full rounded-none shadow-none' : 'max-w-2xl rounded-3xl shadow-2xl'} overflow-hidden flex flex-col ${isPage ? '' : 'max-h-[90vh]'}`}>
            {/* Header */}
            <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black">Style Your Avatar! 🎨</h2>
                    <p className="opacity-80 font-bold">You have {stars} ⭐ to spend</p>
                </div>
                {!isPage && (
                    <button onClick={onClose} className="p-2 bg-white/20 rounded-full hover:bg-white/30">
                        ✖️
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* Preview Area */}
                <div className="p-8 bg-indigo-50 flex flex-col items-center justify-center border-r border-indigo-100 md:w-1/3">
                    <AvatarPreview />
                    <button
                        onClick={handleSave}
                        className="mt-8 w-full bg-green-500 hover:bg-green-600 text-white font-black py-3 rounded-xl shadow-lg transform transition hover:scale-105"
                    >
                        SAVE LOOK ✅
                    </button>
                </div>

                {/* Shop Area */}
                <div className="flex-1 flex flex-col bg-white">
                    {/* Tabs */}
                    <div className="flex p-2 gap-2 border-b border-gray-100 overflow-x-auto">
                        {['skin', 'hat', 'glasses'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-4 py-2 rounded-lg font-bold capitalize transition-colors ${activeTab === tab ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400 hover:bg-gray-50'}`}
                            >
                                {tab}s
                            </button>
                        ))}
                    </div>

                    {/* Items Grid */}
                    <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 pb-20">
                        {filteredItems.map(item => {
                            const isOwned = inventory.includes(item.id);
                            const isEquipped = config[item.type] === item.id;

                            return (
                                <div
                                    key={item.id}
                                    className={`p-4 rounded-xl border-2 flex flex-col items-center text-center transition-all ${isEquipped ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-indigo-200'}`}
                                >
                                    <div className="text-4xl mb-2">{item.icon}</div>
                                    <div className="font-bold text-gray-700 text-sm mb-2">{item.name}</div>

                                    {isOwned ? (
                                        <button
                                            onClick={() => handleEquip(item)}
                                            className={`w-full py-1 rounded-lg text-xs font-bold ${isEquipped ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                        >
                                            {isEquipped ? 'Equipped' : 'Wear'}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleBuy(item)}
                                            className="w-full py-1 rounded-lg text-xs font-bold bg-yellow-400 text-yellow-900 hover:bg-yellow-500"
                                        >
                                            {item.price} ⭐
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );

    if (isPage) return content;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="contents" // motion.div wrapper can cause issues if we pass a fragment, so we use contents or just wrap content
            >
                {/* We reproduce the classes here or put them on content div */}
                <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                    {/* Wait, I defined content above with dynamic classes. */}
                    {/* Let's redefine slightly differently to allow reuse properly */}
                    {content}
                </div>
            </motion.div>
        </div>
    );
};

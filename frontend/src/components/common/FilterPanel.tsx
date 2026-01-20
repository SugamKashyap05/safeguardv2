import React from 'react';
import { Shield } from 'lucide-react';

export interface ContentFilterState {
    ageRestriction: 'preschool' | 'kids' | 'tweens' | 'teens';
    blockedCategories: string[];
    safeSearch: boolean;
}

interface FilterPanelProps {
    filters: ContentFilterState;
    onChange: (filters: ContentFilterState) => void;
    isLoading?: boolean;
}

const CATEGORIES = [
    { id: 'gaming', label: '🎮 Gaming', desc: 'Video game content' },
    { id: 'music', label: '🎵 Music Videos', desc: 'Music videos' },
    { id: 'challenges', label: '⚠️ Challenges', desc: 'Viral challenges' },
    { id: 'unboxing', label: '📦 Unboxing', desc: 'Product unboxing' },
    { id: 'asmr', label: '🔊 ASMR', desc: 'ASMR content' },
    { id: 'livestream', label: '🔴 Livestreams', desc: 'Live content' }
];

export const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onChange, isLoading = false }) => {
    const handleCategoryToggle = (catId: string) => {
        const newCategories = filters.blockedCategories.includes(catId)
            ? filters.blockedCategories.filter(id => id !== catId)
            : [...filters.blockedCategories, catId];
        onChange({ ...filters, blockedCategories: newCategories });
    };

    if (isLoading) return <div className="p-8 text-center bg-white rounded-2xl">Loading Filters...</div>;

    return (
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                    <Shield size={20} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Content Filters</h2>
                    <p className="text-sm text-gray-500">Control what content your child can access</p>
                </div>
            </div>

            {/* Age Restriction */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Age Restriction Level</label>
                <select
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none"
                    value={filters.ageRestriction}
                    onChange={(e) => onChange({ ...filters, ageRestriction: e.target.value as any })}
                >
                    <option value="preschool">Preschool (0-5 years) - Most restrictive</option>
                    <option value="kids">Kids (6-8 years) - Kid-friendly only</option>
                    <option value="tweens">Tweens (9-12 years) - Moderate filtering</option>
                    <option value="teens">Teens (13+ years) - Light filtering</option>
                </select>
            </div>

            {/* Blocked Categories */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Blocked Categories</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {CATEGORIES.map(cat => {
                        const isBlocked = filters.blockedCategories.includes(cat.id);
                        return (
                            <label
                                key={cat.id}
                                className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${isBlocked
                                        ? 'border-red-300 bg-red-50'
                                        : 'border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    className="mt-1 w-4 h-4 text-red-600 rounded"
                                    checked={isBlocked}
                                    onChange={() => handleCategoryToggle(cat.id)}
                                />
                                <div>
                                    <span className={`font-medium ${isBlocked ? 'text-red-900' : 'text-gray-800'}`}>
                                        {cat.label}
                                    </span>
                                    <p className="text-xs text-gray-500">{cat.desc}</p>
                                </div>
                            </label>
                        );
                    })}
                </div>
            </div>

            {/* Safe Search */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                    <h3 className="font-bold text-gray-800">Safe Search</h3>
                    <p className="text-sm text-gray-500">Enforce safe search on all queries</p>
                </div>
                <button
                    className={`w-14 h-8 rounded-full transition-colors relative ${filters.safeSearch ? 'bg-green-500' : 'bg-gray-300'}`}
                    onClick={() => onChange({ ...filters, safeSearch: !filters.safeSearch })}
                >
                    <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${filters.safeSearch ? 'right-1' : 'left-1'}`} />
                </button>
            </div>
        </section>
    );
};

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
// @ts-ignore
import { HistoryList } from '../../components/dashboard/HistoryList';
// @ts-ignore
import { ActivityStats } from '../../components/dashboard/ActivityStats';
import { Shield } from 'lucide-react';
// @ts-ignore
import { useParams } from 'react-router-dom';

export const ParentActivityPage = () => {
    const { childId } = useParams();
    const [activeTab, setActiveTab] = useState<'history' | 'stats' | 'blocked'>('history');

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Activity & History</h1>
                    <p className="text-gray-500">Track what they are watching and when</p>
                </div>
                {/* Child Selector could go here if global context/params not enough */}
            </header>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200">
                {['history', 'stats', 'blocked'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`pb-4 px-2 text-sm font-bold capitalize transition-colors border-b-2 ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[500px]">
                {activeTab === 'history' && <HistoryList childId={childId!} />}
                {activeTab === 'stats' && <ActivityStats childId={childId!} />}
                {activeTab === 'blocked' && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Blocked Content Log</h3>
                        <p className="text-gray-500 max-w-md mx-auto mt-2">
                            Here you will see a list of any videos or channels that were automatically blocked based on your filters.
                        </p>
                        <div className="mt-8 p-4 bg-gray-50 rounded-xl max-w-lg mx-auto border border-gray-100">
                            <p className="text-sm text-gray-400 italic">No blocked attempts recorded this week.</p>
                            {/* Real implementation would fetch blocked history similar to HistoryList but filtered */}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

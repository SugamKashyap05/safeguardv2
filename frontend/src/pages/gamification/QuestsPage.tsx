import React from 'react';
import { useNavigate } from 'react-router-dom';
import { QuestLog } from '../../components/gamification/QuestLog';

export const QuestsPage = () => {
    const navigate = useNavigate();
    const childId = localStorage.getItem('activeChildId') || '';

    if (!childId) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 font-outfit">
            <header className="bg-white/80 backdrop-blur-md shadow-sm p-4 flex items-center justify-between sticky top-0 z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-slate-600 hover:text-indigo-600 font-bold transition-colors"
                >
                    <span className="text-xl mr-2">←</span> Back
                </button>
                <h1 className="text-xl font-bold text-slate-800">Daily Quests</h1>
                <div className="w-10"></div>
            </header>

            <main className="container mx-auto p-4 max-w-4xl">
                <div className="mb-8 text-center">
                    <h2 className="text-3xl font-black text-indigo-900 mb-2">Adventure Awaits!</h2>
                    <p className="text-slate-600 text-lg">Complete daily quests to earn stars and level up.</p>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-xl border-4 border-indigo-100">
                    <QuestLog childId={childId} />
                </div>
            </main>
        </div>
    );
};

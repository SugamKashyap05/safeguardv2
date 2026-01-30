import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AvatarEditor } from '../../components/gamification/AvatarEditor';
import { useGamification } from '../../contexts/GamificationContext';

export const ShopPage = () => {
    const navigate = useNavigate();
    const childId = localStorage.getItem('activeChildId') || '';
    const { totalStars } = useGamification();

    if (!childId) return null;

    return (
        <div className="min-h-screen bg-slate-50 font-outfit">
            <header className="bg-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-slate-600 hover:text-indigo-600 font-bold transition-colors"
                >
                    <span className="text-xl mr-2">←</span> Back
                </button>
                <h1 className="text-xl font-bold text-slate-800">Avatar Shop</h1>
                <div className="flex items-center gap-2 bg-amber-100 px-3 py-1 rounded-full text-amber-800 font-bold">
                    <span>⭐</span>
                    <span>{totalStars}</span>
                </div>
            </header>

            <div className="h-[calc(100vh-64px)] p-4">
                <AvatarEditor childId={childId} onClose={() => navigate(-1)} isPage={true} />
            </div>
        </div>
    );
};

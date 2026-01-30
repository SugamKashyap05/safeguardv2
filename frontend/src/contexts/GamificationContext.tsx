
import React, { createContext, useContext, useState, useCallback } from 'react';
import { gamificationService, Badge } from '../services/gamification.service';

interface GamificationContextType {
    badges: Badge[];
    stars: number;
    totalStars: number;
    setStars: (stars: number) => void;
    setTotalStars: (stars: number) => void;
    refreshBadges: (childId: string) => Promise<void>;
}

const GamificationContext = createContext<GamificationContextType | null>(null);

export const useGamification = () => {
    const context = useContext(GamificationContext);
    if (!context) throw new Error('useGamification must be used within GamificationProvider');
    return context;
};

// Simple provider - in real app would integrate with ChildContext
export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [badges, setBadges] = useState<Badge[]>([]);
    const [stars, setStars] = useState(0);
    const [totalStars, setTotalStars] = useState(0);

    const refreshBadges = useCallback(async (childId: string) => {
        try {
            const data = await gamificationService.getBadges(childId);
            setBadges(data);
        } catch (error) {
            console.error('Failed to fetch badges', error);
        }
    }, []);

    const value = {
        badges,
        stars,
        totalStars,
        setStars,
        setTotalStars,
        refreshBadges
    };

    return (
        <GamificationContext.Provider value={value}>
            {children}
        </GamificationContext.Provider>
    );
};

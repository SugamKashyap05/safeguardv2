
import React from 'react';
import { motion } from 'framer-motion';

interface StarDisplayProps {
    stars: number;
}

export const StarDisplay: React.FC<StarDisplayProps> = ({ stars }) => {
    return (
        <div className="flex items-center bg-yellow-100 rounded-full px-4 py-2 border-2 border-yellow-300 shadow-sm">
            <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                className="text-2xl mr-2"
            >
                ⭐
            </motion.div>
            <span className="text-xl font-bold text-yellow-800">{stars} Stars</span>
        </div>
    );
};

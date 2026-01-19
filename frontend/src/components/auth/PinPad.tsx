import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Delete, X } from 'lucide-react';
import clsx from 'clsx';

interface PinPadProps {
    onComplete: (pin: string) => void;
    isLoading?: boolean;
    error?: string;
    onClearError?: () => void;
}

export const PinPad: React.FC<PinPadProps> = ({ onComplete, isLoading, error, onClearError }) => {
    const [pin, setPin] = useState('');

    useEffect(() => {
        if (pin.length === 4) {
            onComplete(pin);
            // Optional: Auto-clear on error is handled by parent or by user interaction
        }
    }, [pin, onComplete]);

    const handlePress = (num: string) => {
        if (error && onClearError) onClearError();
        if (pin.length < 4) {
            setPin(prev => prev + num);
        }
    };

    const handleDelete = () => {
        if (error && onClearError) onClearError();
        setPin(prev => prev.slice(0, -1));
    };

    return (
        <div className="w-full max-w-sm mx-auto">
            {/* Visual Feedback */}
            <div className="flex justify-center gap-6 mb-8">
                {[0, 1, 2, 3].map(i => (
                    <motion.div
                        key={i}
                        animate={{
                            scale: pin.length > i ? 1.2 : 1,
                            backgroundColor: pin.length > i ? '#FBBF24' : '#F3F4F6' // yellow-400 vs gray-100
                        }}
                        className={clsx(
                            "w-6 h-6 rounded-full border-2 transition-colors",
                            error ? "border-red-400 bg-red-100" : "border-gray-200"
                        )}
                    />
                ))}
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-red-500 font-bold mb-4 bg-red-50 py-2 rounded-xl"
                >
                    {error}
                </motion.div>
            )}

            {/* Buttons */}
            <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button
                        key={num}
                        disabled={isLoading}
                        onClick={() => handlePress(num.toString())}
                        className="aspect-square bg-white rounded-2xl shadow-sm border border-gray-100 text-3xl font-bold text-gray-700 hover:bg-yellow-50 hover:border-yellow-200 active:scale-95 transition-all flex items-center justify-center"
                    >
                        {num}
                    </button>
                ))}

                <div /> {/* Spacer */}

                <button
                    disabled={isLoading}
                    onClick={() => handlePress('0')}
                    className="aspect-square bg-white rounded-2xl shadow-sm border border-gray-100 text-3xl font-bold text-gray-700 hover:bg-yellow-50 hover:border-yellow-200 active:scale-95 transition-all flex items-center justify-center"
                >
                    0
                </button>

                <button
                    disabled={isLoading}
                    onClick={handleDelete}
                    className="aspect-square bg-white rounded-2xl shadow-sm border border-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-100 active:scale-95 transition-all flex items-center justify-center"
                >
                    <Delete size={32} />
                </button>
            </div>
        </div>
    );
};

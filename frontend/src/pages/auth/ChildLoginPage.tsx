import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChildService } from '../../services/auth.service';
import { PinPad } from '../../components/auth/PinPad';
import { Play, HelpCircle, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import { api } from '../../services/api';

export const ChildLoginPage = () => {
    const [step, setStep] = useState<'SELECT' | 'PIN'>('SELECT');
    const [children, setChildren] = useState<any[]>([]);
    const [selectedChild, setSelectedChild] = useState<any>(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Load children from API (requires parent auth)
        // If parent not logged in, this will fail - prompt parent login?
        // Ideally we store cached children in localStorage for this "Kiosk Mode"
        loadChildren();
    }, []);

    const loadChildren = async () => {
        try {
            const res = await ChildService.getAll();
            if (res.success) setChildren(res.data);
        } catch (err) {
            console.error(err);
            // Verify if we have cached children
        }
    };

    const handleChildSelect = (child: any) => {
        if (!child.is_active) return;
        setSelectedChild(child);
        setStep('PIN');
        setError('');
    };

    const handlePinSubmit = async (pin: string) => {
        setIsLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/child/login', {
                childId: selectedChild.id,
                pin
            });

            if (res.data.success) {
                // Login Success
                console.log('Login Response:', res.data);
                localStorage.setItem('activeChildId', selectedChild.id);
                localStorage.setItem('activeChildName', selectedChild.name);
                localStorage.setItem('safeguard_token', res.data.data.token);
                // navigate to dashboard
                window.location.href = '/child/dashboard'; // Using href to ensure clean slate or navigate if using router hook
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Oops! Try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FFFDF5] text-gray-800 flex flex-col relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-300 rounded-full blur-[100px] opacity-30" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-300 rounded-full blur-[100px] opacity-30" />

            {/* Header */}
            <header className="p-8 flex justify-between items-center relative z-10">
                {step === 'PIN' ? (
                    <button onClick={() => setStep('SELECT')} className="flex items-center gap-2 text-gray-500 font-bold hover:text-gray-800 transition-colors">
                        <ArrowLeft /> Back
                    </button>
                ) : (
                    <div className="text-2xl font-black text-yellow-500 tracking-tighter">SafeGuard Kids</div>
                )}

                <button className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm text-sm font-bold text-gray-500 hover:bg-gray-50">
                    <HelpCircle size={18} /> Ask Parent
                </button>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">
                <AnimatePresence mode="wait">
                    {step === 'SELECT' ? (
                        <motion.div
                            key="select"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="text-center w-full max-w-4xl"
                        >
                            <h1 className="text-4xl md:text-5xl font-extrabold mb-12 text-gray-800">Who's playing today?</h1>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-items-center">
                                {children.map(child => (
                                    <button
                                        key={child.id}
                                        onClick={() => handleChildSelect(child)}
                                        disabled={!child.is_active}
                                        className="group flex flex-col items-center gap-4 transition-transform hover:scale-105"
                                    >
                                        <div className={clsx(
                                            "w-32 h-32 rounded-3xl flex items-center justify-center text-6xl shadow-xl border-4 transition-all relative overflow-hidden bg-white",
                                            !child.is_active ? "grayscale opacity-50 border-gray-200" : "border-white group-hover:border-yellow-400"
                                        )}>
                                            {child.avatar || '🐼'}
                                            {!child.is_active && <div className="absolute inset-0 bg-gray-200/50 flex items-center justify-center text-xs font-bold text-gray-600 uppercase tracking-widest">Paused</div>}
                                        </div>
                                        <span className="text-xl font-bold text-gray-700">{child.name}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="pin"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full max-w-md"
                        >
                            <div className="text-center mb-8">
                                <div className="w-24 h-24 bg-white rounded-full mx-auto mb-4 flex items-center justify-center text-5xl shadow-lg border-4 border-yellow-300">
                                    {selectedChild?.avatar}
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">Hi {selectedChild?.name}!</h2>
                                <p className="text-gray-500">Enter your secret PIN</p>
                            </div>

                            <PinPad
                                onComplete={handlePinSubmit}
                                isLoading={isLoading}
                                error={error}
                                onClearError={() => setError('')}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

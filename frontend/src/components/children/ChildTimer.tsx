import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, RefreshCw, X } from 'lucide-react';
import { api } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';

export const ChildTimer = ({ childId, onTimeExpire }: { childId: string; onTimeExpire?: () => void }) => {
    const [stats, setStats] = useState<{ 
        minutes: number; 
        spent: number; 
        added: number; 
        limit: number;
        isPaused?: boolean;
    } | null>(null);
    const [mood, setMood] = useState<'happy' | 'sleepy' | 'asleep'>('happy');
    const [isChecking, setIsChecking] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const { socket } = useSocket() || {};

    const [secondsLeft, setSecondsLeft] = useState(0);

    // Fetch Time Status
    const checkTime = async () => {
        setIsChecking(true);
        try {
            const res = await api.get(`/screentime/${childId}/remaining`);
            const data = res.data.data;
            setStats(data);

            // Sync local countdown with drift check
            const serverSeconds = Math.floor(data.minutes * 60); // Use floor to avoid fractional seconds

            // Only force update if drift is significant (> 30 seconds discrepancy)
            // Or if we never initialized (secondsLeft === 0)
            // Or if the server time is SUBSTANTIALLY different (e.g. parent added time)
            // Or if server reports time expired (0 seconds) - this is critical for auto-pause
            // Use more conservative thresholds to prevent reset loops
            const shouldSync =
                secondsLeft === 0 ||
                serverSeconds === 0 || // Time expired on server - sync to 0
                serverSeconds > secondsLeft + 120 || // Parent added significant time
                Math.abs(serverSeconds - secondsLeft) > 30; // Moderate drift

            if (shouldSync) {
                setSecondsLeft(serverSeconds);
            }

            // Determine Mood - use seconds for precise comparison
            const remainingSeconds = data.minutes * 60;
            const isPaused = data.isPaused === true;

            if (remainingSeconds <= 0.5 || isPaused) { // Lock if less than half second or paused
                setMood('asleep');
                if (onTimeExpire && !isPaused) onTimeExpire();
            }
            else if (remainingSeconds <= 300) setMood('sleepy'); // 5 minutes or less
            else setMood('happy');

        } catch (err) {
            console.error('Timer check failed:', err);
        } finally {
            setTimeout(() => setIsChecking(false), 500); // Visual delay for feedback
        }
    };

    useEffect(() => {
        checkTime();
        // Poll every 55 seconds to avoid conflict with minute boundaries
        const interval = setInterval(checkTime, 55000);

        if (socket) {
            console.log('🔌 ChildTimer: Socket Listening');
            socket.on('settings:updated', () => {
                console.log('⚡ ChildTimer: Received settings:updated');
                checkTime();
            });
            socket.on('limits:updated', checkTime);
        }

        return () => {
            clearInterval(interval);
            if (socket) {
                socket.off('settings:updated');
                socket.off('limits:updated');
            }
        };
    }, [childId, socket]);

    // Local Countdown Effect - Fixed to prevent drift
    useEffect(() => {
        if (secondsLeft <= 0) return;

        let startTime: number;
        let expected: number;
        let timer: NodeJS.Timeout;

        const tick = () => {
            const now = Date.now();
            const elapsed = now - startTime;

            // Calculate how many seconds should have passed
            const secondsPassed = Math.floor(elapsed / 1000);
            const newSecondsLeft = Math.max(0, secondsLeft - secondsPassed);

            if (newSecondsLeft <= 0) {
                setSecondsLeft(0);
                checkTime(); // Confirm with server
                return;
            }

            setSecondsLeft(newSecondsLeft);

            // Schedule next tick with precise timing
            expected += 1000;
            const drift = now - expected;
            const nextTick = Math.max(0, 1000 - drift);

            timer = setTimeout(tick, nextTick);
        };

        startTime = Date.now();
        expected = startTime + 1000;
        timer = setTimeout(tick, 1000);

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [secondsLeft]);

    // --- PREMIUM AUDIO FEEDBACK (Procedural Snoring) ---
    useEffect(() => {
        let audioContext: AudioContext | null = null;
        let oscillator: OscillatorNode | null = null;
        let gainNode: GainNode | null = null;

        if (mood === 'asleep') {
            const startSnoring = () => {
                try {
                    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                    oscillator = audioContext.createOscillator();
                    gainNode = audioContext.createGain();

                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(40, audioContext.currentTime); // Low bass breathe

                    // Snoring rhythm (Inhale/Exhale)
                    const now = audioContext.currentTime;
                    for (let i = 0; i < 100; i++) {
                        const time = now + i * 4;
                        // Inhale
                        gainNode.gain.exponentialRampToValueAtTime(0.01, time);
                        gainNode.gain.exponentialRampToValueAtTime(0.05, time + 2);
                        // Exhale
                        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 4);
                    }

                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    oscillator.start();
                } catch (e) {
                    console.warn('Audio feedback failed:', e);
                }
            };

            // Try to start, but might need interaction
            startSnoring();

            // Add interaction listener in case of blocked auto-play
            const handleInteraction = () => {
                if (audioContext?.state === 'suspended') {
                    audioContext.resume();
                }
                window.removeEventListener('click', handleInteraction);
            };
            window.addEventListener('click', handleInteraction);
        }

        return () => {
            if (oscillator) oscillator.stop();
            if (audioContext) audioContext.close();
        };
    }, [mood]);

    // Format Seconds to MM:SS
    const formatTime = (totalSeconds: number) => {
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (!stats) return null;

    // Calculate Stamina Percentage (Cap at 100%)
    // Assuming 'limit' is the daily limit. If limit is 0 (unlimited?), default to 100.
    const totalTime = stats.limit || 60;
    const percentage = Math.min(100, Math.max(0, (stats.minutes / totalTime) * 100));

    // Colors based on mood/time
    const getBarColor = () => {
        if (stats.minutes > 30) return 'bg-gradient-to-t from-green-400 to-green-300 shadow-[0_0_20px_rgba(74,222,128,0.5)]';
        if (stats.minutes > 10) return 'bg-gradient-to-t from-yellow-400 to-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.5)]';
        return 'bg-gradient-to-t from-red-400 to-red-300 shadow-[0_0_20px_rgba(248,113,113,0.5)]';
    };

    return (
        <>
            {/* --- ADVENTURE BUDDY AVATAR (Click Trigger) --- */}
            {/* Only show interactive avatar if NOT asleep (Time's Up overlay handles the UI then) */}
            {mood !== 'asleep' && (
                <motion.div
                    className="fixed top-4 right-4 z-[50]"
                    initial={{ y: -100 }}
                    animate={{ y: 0 }}
                >
                    <div className="relative group cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                        {/* Main Avatar Circle */}
                        <motion.div
                            className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center text-4xl border-4 border-white relative z-20 overflow-hidden hover:scale-105 transition-transform"
                            whileTap={{ scale: 0.95 }}
                            animate={mood === 'sleepy' ? { rotate: [0, 5, -5, 0] } : {}}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            {mood === 'happy' && '🦁'}
                            {mood === 'sleepy' && '🥱'}
                        </motion.div>

                        {/* Mini Status Badge (always visible) */}
                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white z-30 shadow-sm ${stats.minutes <= 5 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}>
                            {Math.ceil(stats.minutes)}
                        </div>
                    </div>

                    {/* --- POPUP DETAILS --- */}
                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, x: 20, y: -20 }}
                                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, x: 20, y: -20 }}
                                className="absolute top-20 right-0 bg-white/95 backdrop-blur-xl p-5 rounded-3xl shadow-2xl w-64 border border-white/50 origin-top-right z-40"
                            >
                                {/* Close Button */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                                >
                                    <X size={16} />
                                </button>

                                <div className="flex flex-col gap-4">
                                    {/* Header */}
                                    <div>
                                        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Time Remaining</h3>
                                        <div className="flex items-baseline gap-1">
                                            <span className={`text-4xl font-black ${stats.minutes <= 5 ? 'text-red-500' : 'text-gray-800'}`}>
                                                {formatTime(secondsLeft)}
                                            </span>
                                            <span className="text-gray-400 font-bold">min</span>
                                        </div>
                                    </div>

                                    {/* Stamina Bar */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold text-gray-400">
                                            <span>Energy</span>
                                            <span>{Math.round(percentage)}%</span>
                                        </div>
                                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-100 shadow-inner">
                                            <motion.div
                                                className={`h-full rounded-full ${getBarColor()}`}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentage}%` }}
                                                transition={{ type: "spring", stiffness: 50 }}
                                            />
                                        </div>
                                    </div>

                                    {/* Refresh Button */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); checkTime(); }}
                                        disabled={isChecking}
                                        className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors text-sm"
                                    >
                                        <RefreshCw size={14} className={isChecking ? "animate-spin" : ""} />
                                        {isChecking ? 'Syncing...' : 'Check Time'}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}


            {/* --- "TIME'S UP" FULL SCREEN LOCK --- */}
            <AnimatePresence>
                {mood === 'asleep' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/98 z-[9999] flex flex-col items-center justify-center text-white p-8 text-center"
                    >
                        {/* Floating Zzz */}
                        <motion.div
                            className="absolute inset-0 pointer-events-none"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            {[...Array(5)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute text-4xl font-black text-slate-700 select-none"
                                    initial={{
                                        x: Math.random() * window.innerWidth,
                                        y: Math.random() * window.innerHeight
                                    }}
                                    animate={{
                                        y: [0, -50],
                                        opacity: [0, 0.5, 0]
                                    }}
                                    transition={{
                                        duration: 3 + Math.random(),
                                        repeat: Infinity,
                                        delay: Math.random() * 2
                                    }}
                                >
                                    Zzz
                                </motion.div>
                            ))}
                        </motion.div>

                        <motion.div
                            initial={{ scale: 0.8, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-slate-800 p-10 rounded-[3rem] border border-slate-700 shadow-2xl max-w-lg w-full relative overflow-hidden"
                        >
                            <div className="text-8xl mb-6 relative inline-block">
                                🦁
                                <motion.span
                                    className="absolute -top-4 -right-4 text-4xl"
                                    animate={{ opacity: [0, 1, 0], y: -20, x: 10 }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    💤
                                </motion.span>
                            </div>

                            <h1 className="text-4xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-300">
                                {stats?.isPaused ? "Taking a Little Break!" : "Shhh... I'm Sleeping!"}
                            </h1>
                            <p className="text-xl text-slate-400 font-medium mb-10 leading-relaxed">
                                {stats?.isPaused 
                                    ? "Your parent has paused the screen. Rest your eyes for a bit!" 
                                    : "You've played enough for today. Come back tomorrow to play more!"
                                }
                                <br />
                                {!stats?.isPaused && <span className="text-yellow-400">Time's Up!</span>}
                            </p>

                            {/* Message Only - No Button (Auto-unlocks via Socket/Poll) */}
                            <div className="mt-8 flex justify-center">
                                <div className="px-6 py-3 bg-white/5 rounded-full border border-white/10 text-slate-400 text-sm font-bold animate-pulse">
                                    Waiting for parent to add time...
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

import React from 'react';
import { useForm } from 'react-hook-form';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

type FormData = {
    childCount: number;
    tier: 'free' | 'premium' | 'family';
};

export const FamilyStep = ({ onNext }: { onNext: (data: any) => void }) => {
    const { register, setValue, watch, handleSubmit } = useForm<FormData>({
        defaultValues: { childCount: 1, tier: 'free' }
    });

    const currentTier = watch('tier');
    const childCount = watch('childCount');

    const onSubmit = (data: FormData) => {
        // Here we would typically call API to update parent profile with tier
        // For now just proceed
        onNext(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
                <label className="block text-lg font-bold text-gray-800">1. How many little explorers?</label>
                <div className="flex gap-4">
                    {[1, 2, 3, 4, 5].map((num) => (
                        <button
                            key={num}
                            type="button"
                            onClick={() => setValue('childCount', num)}
                            className={clsx(
                                "w-12 h-12 rounded-full font-bold text-lg transition-all border-2",
                                childCount === num
                                    ? "bg-yellow-400 border-yellow-500 text-yellow-900 scale-110 shadow-lg"
                                    : "bg-white border-gray-200 text-gray-400 hover:border-yellow-300"
                            )}
                        >
                            {num}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <label className="block text-lg font-bold text-gray-800">2. Choose your Safeguard Plan</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Free Tier */}
                    <div
                        onClick={() => setValue('tier', 'free')}
                        className={clsx("cursor-pointer rounded-2xl p-4 border-2 transition-all relative overflow-hidden",
                            currentTier === 'free' ? "border-yellow-400 bg-yellow-50 shadow-md ring-2 ring-yellow-200" : "border-gray-100 hover:border-yellow-200"
                        )}
                    >
                        {currentTier === 'free' && <div className="absolute top-2 right-2 text-yellow-600"><Check size={20} /></div>}
                        <h3 className="font-bold text-gray-800">Scout</h3>
                        <p className="text-2xl font-extrabold my-2">$0</p>
                        <p className="text-xs text-gray-500 mb-4">Forever free</p>
                        <ul className="text-xs space-y-2 text-gray-600">
                            <li>• 1 Child Profile</li>
                            <li>• Basic Safety Filter</li>
                            <li>• 2h Screen Time/day</li>
                        </ul>
                    </div>

                    {/* Premium Tier */}
                    <div
                        onClick={() => setValue('tier', 'premium')}
                        className={clsx("cursor-pointer rounded-2xl p-4 border-2 transition-all relative overflow-hidden",
                            currentTier === 'premium' ? "border-orange-400 bg-orange-50 shadow-md ring-2 ring-orange-200" : "border-gray-100 hover:border-orange-200"
                        )}
                    >
                        {currentTier === 'premium' && <div className="absolute top-2 right-2 text-orange-600"><Check size={20} /></div>}
                        <h3 className="font-bold text-gray-800">Guardian</h3>
                        <p className="text-2xl font-extrabold my-2 text-orange-600">$9</p>
                        <p className="text-xs text-gray-500 mb-4">per month</p>
                        <ul className="text-xs space-y-2 text-gray-600">
                            <li>• 3 Child Profiles</li>
                            <li>• Advanced AI Monitoring</li>
                            <li>• Unlimited Screen Time</li>
                        </ul>
                    </div>

                    {/* Family Tier */}
                    <div
                        onClick={() => setValue('tier', 'family')}
                        className={clsx("cursor-pointer rounded-2xl p-4 border-2 transition-all relative overflow-hidden",
                            currentTier === 'family' ? "border-purple-400 bg-purple-50 shadow-md ring-2 ring-purple-200" : "border-gray-100 hover:border-purple-200"
                        )}
                    >
                        {currentTier === 'family' && <div className="absolute top-2 right-2 text-purple-600"><Check size={20} /></div>}
                        <h3 className="font-bold text-gray-800">Family Fortress</h3>
                        <p className="text-2xl font-extrabold my-2 text-purple-600">$19</p>
                        <p className="text-xs text-gray-500 mb-4">per month</p>
                        <ul className="text-xs space-y-2 text-gray-600">
                            <li>• 5+ Child Profiles</li>
                            <li>• Priority Support</li>
                            <li>• Weekly Reports</li>
                        </ul>
                    </div>
                </div>
            </div>

            <button
                type="submit"
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold py-4 rounded-xl shadow-lg shadow-yellow-400/30 transform transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
                Continue Adventure
            </button>
        </form>
    );
};

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import clsx from 'clsx';
import { api } from '../../../services/api';

const schema = z.object({
    name: z.string().min(1, "Name is required"),
    age: z.coerce.number().min(3).max(10),
    pin: z.string().regex(/^\d{4}$/, "PIN must be 4 digits")
        .refine(val => !['1234', '1111', '0000', '1212'].includes(val), "Use a stronger PIN (no 1234, 1111)")
});

type FormData = z.infer<typeof schema>;

const AVATARS = ['🦁', '🐯', '🐻', '🐼', '🐨', '🦊', '🐸', '🦄'];

export const ChildProfileStep = ({ onNext }: { onNext: (data: any) => void }) => {
    const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
        // @ts-ignore
        resolver: zodResolver(schema),
        defaultValues: { age: 5 }
    });

    const age = watch('age');

    // Calculate level based on age
    const getLevel = (a: number) => {
        if (a <= 5) return { label: 'Preschool (3-5)', color: 'text-green-500', bg: 'bg-green-100' };
        if (a <= 7) return { label: 'Early Reader (6-7)', color: 'text-blue-500', bg: 'bg-blue-100' };
        return { label: 'Explorer (8-10)', color: 'text-purple-500', bg: 'bg-purple-100' };
    };

    const level = getLevel(age || 5);

    const onSubmit = async (data: FormData) => {
        try {
            // Call API to create child
            await api.post('/children', {
                name: data.name,
                age: data.age,
                pin: data.pin,
                avatar: selectedAvatar
            });
            onNext(data);
        } catch (err) {
            console.error(err);
            alert('Failed to create child profile. Please check requirements.');
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex gap-6">
                {/* Avatar Selection */}
                <div className="flex-shrink-0">
                    <label className="block text-sm font-bold text-gray-700 mb-2 text-center">Avatar</label>
                    <div className="grid grid-cols-2 gap-2 w-32">
                        {AVATARS.map(avatar => (
                            <button
                                key={avatar}
                                type="button"
                                onClick={() => setSelectedAvatar(avatar)}
                                className={clsx("w-14 h-14 text-2xl bg-gray-50 rounded-xl hover:bg-yellow-100 transition-colors flex items-center justify-center border-2",
                                    selectedAvatar === avatar ? "border-yellow-400 bg-yellow-50" : "border-transparent"
                                )}
                            >
                                {avatar}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Inputs */}
                <div className="flex-1 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Child's Name</label>
                        <input
                            {...register('name')}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-yellow-200 focus:border-yellow-400 outline-none"
                            placeholder="e.g. Leo"
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-bold text-gray-700">Age: {age}</label>
                            <span className={clsx("text-xs font-bold px-2 py-1 rounded-full", level.color, level.bg)}>{level.label}</span>
                        </div>
                        <input
                            type="range"
                            min="3"
                            max="10"
                            step="1"
                            {...register('age')}
                            className="w-full accent-yellow-400 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Secret PIN</label>
                        <input
                            type="text"
                            maxLength={4}
                            {...register('pin')}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-yellow-200 focus:border-yellow-400 outline-none tracking-widest text-center font-mono text-lg"
                            placeholder="0000"
                        />
                        <p className="text-xs text-gray-400 mt-1">4 digits. Avoid simple patterns like 1234.</p>
                        {errors.pin && <p className="text-red-500 text-xs mt-1">{errors.pin.message}</p>}
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold py-4 rounded-xl shadow-lg shadow-yellow-400/30 transform transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
                {isSubmitting ? 'Creating Profile...' : 'Finish Setup'}
            </button>
        </form>
    );
};

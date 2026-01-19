
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { ChildService } from '../../services/auth.service';
import clsx from 'clsx';

const schema = z.object({
    name: z.string().min(1, "Name is required"),
    age: z.coerce.number().min(3).max(10),
    pin: z.string().regex(/^\d{4}$/, "PIN must be 4 digits"),
    avatar: z.string().min(1)
});

type FormData = z.infer<typeof schema>;
const AVATARS = ['🦁', '🐯', '🐻', '🐼', '🐨', '🦊', '🐸', '🦄'];

export const AddChildModal = ({ isOpen, onClose, onRefresh }: any) => {
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
        // @ts-ignore - Schema coercion types mismatch with RHF strict types sometimes
        resolver: zodResolver(schema),
        defaultValues: { age: 5, avatar: AVATARS[0] }
    });

    const selectedAvatar = watch('avatar');

    const onSubmit = async (data: FormData) => {
        try {
            await ChildService.create({
                ...data,
                dailyScreenTimeLimit: 60 // Default
            });
            onRefresh();
            onClose();
        } catch (err) {
            alert('Error creating child');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
                <div className="p-6 bg-yellow-400 flex justify-between items-center text-yellow-900">
                    <h2 className="text-2xl font-bold">Add New Adventurer</h2>
                    <button onClick={onClose} className="bg-white/20 p-2 rounded-full hover:bg-white/40"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
                    {/* Avatar Picker */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Choose an Avatar</label>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                            {AVATARS.map(av => (
                                <button
                                    key={av}
                                    type="button"
                                    onClick={() => setValue('avatar', av)}
                                    className={clsx("flex-shrink-0 w-12 h-12 text-2xl rounded-xl border-2 transition-all flex items-center justify-center",
                                        selectedAvatar === av ? "border-yellow-400 bg-yellow-50 scale-110" : "border-gray-100 bg-gray-50"
                                    )}
                                >
                                    {av}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Name</label>
                            <input {...register('name')} className="w-full px-4 py-3 rounded-xl border bg-gray-50 focus:ring-2 focus:ring-yellow-400 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Age</label>
                            <input type="number" {...register('age')} className="w-full px-4 py-3 rounded-xl border bg-gray-50 focus:ring-2 focus:ring-yellow-400 outline-none" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Secret PIN</label>
                        <input type="text" maxLength={4} {...register('pin')} className="w-full px-4 py-3 rounded-xl border bg-gray-50 focus:ring-2 focus:ring-yellow-400 outline-none text-center font-mono tracking-widest text-lg" />
                    </div>

                    <button type="submit" className="w-full bg-yellow-400 text-yellow-900 font-bold py-4 rounded-xl shadow-lg hover:bg-yellow-500 transition-transform active:scale-95">
                        Create Profile
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

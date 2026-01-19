import React from 'react';
import { useForm } from 'react-hook-form';
import { X, PauseCircle } from 'lucide-react';
// @ts-ignore
import api from '../../services/api';

interface EmergencyPauseModalProps {
    isOpen: boolean;
    onClose: () => void;
    childId: string;
    childName: string;
    onSuccess: () => void;
}

const EmergencyPauseModal = ({ isOpen, onClose, childId, childName, onSuccess }: EmergencyPauseModalProps) => {
    const { register, handleSubmit, formState: { isSubmitting } } = useForm();

    if (!isOpen) return null;

    const onSubmit = async (data: any) => {
        try {
            await api.post(`/emergency/pause/${childId}`, {
                reason: data.reason,
                duration: data.duration === 'null' ? null : parseInt(data.duration)
            });
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Pause failed', err);
            alert('Failed to pause. Please try again.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">

                <div className="bg-red-50 p-6 flex justify-between items-center border-b border-red-100">
                    <div className="flex items-center space-x-3">
                        <div className="bg-red-100 p-2 rounded-full">
                            <PauseCircle className="text-red-600" size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-red-900">Pause {childName}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-red-100 rounded-full transition-colors text-red-400">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-gray-600 mb-6">
                        This will immediately stop any video they are watching and block access.
                    </p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Reason</label>
                            <select
                                {...register('reason', { required: true })}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                            >
                                <option value="Dinner time">Dinner time 🍽️</option>
                                <option value="Bedtime">Bedtime 🌙</option>
                                <option value="Homework time">Homework time 📚</option>
                                <option value="Misbehavior">Time out 🛑</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Duration</label>
                            <select
                                {...register('duration')}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                            >
                                <option value="30">30 minutes</option>
                                <option value="60">1 hour</option>
                                <option value="120">2 hours</option>
                                <option value="null">Until I resume manually</option>
                            </select>
                        </div>

                        <div className="pt-4 flex space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 py-3 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                            >
                                {isSubmitting ? 'Pausing...' : 'Pause Access Now'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EmergencyPauseModal;

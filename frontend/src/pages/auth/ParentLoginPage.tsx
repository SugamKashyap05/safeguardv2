import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthService } from '../../services/auth.service';
import { useNavigate, Link } from 'react-router-dom';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

const schema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export const ParentLoginPage = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema)
    });

    const onSubmit = async (data: FormData) => {
        setError('');
        try {
            await AuthService.login({
                email: data.email,
                password: data.password
            });
            // Redirect to dashboard on success
            navigate('/parent/dashboard');
        } catch (err: any) {
            console.error(err);
            const message = err.response?.data?.message || 'Login failed. Please check your credentials.';
            setError(message);
        }
    };

    return (
        <div className="min-h-screen bg-[#FFFDF5] text-gray-800 flex flex-col relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-300 rounded-full blur-[100px] opacity-30" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-300 rounded-full blur-[100px] opacity-30" />

            {/* Header */}
            <header className="p-8 flex justify-between items-center relative z-10">
                <div className="text-2xl font-black text-yellow-500 tracking-tighter flex items-center gap-2">
                    <ShieldCheck className="w-8 h-8" />
                    SafeGuard
                </div>
                <Link to="/signup" className="text-sm font-bold text-gray-500 hover:text-yellow-600 transition-colors">
                    Create Account
                </Link>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl w-full max-w-md border border-white/50"
                >
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Welcome Back</h1>
                        <p className="text-gray-500">Sign in to manage your family's safety</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center gap-2 border border-red-100">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input
                                {...register('email')}
                                className={clsx("w-full px-4 py-3 rounded-xl border focus:ring-4 focus:ring-yellow-200 focus:border-yellow-400 transition-all outline-none",
                                    errors.email ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50/50"
                                )}
                                placeholder="email@example.com"
                            />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                {...register('password')}
                                className={clsx("w-full px-4 py-3 rounded-xl border focus:ring-4 focus:ring-yellow-200 focus:border-yellow-400 transition-all outline-none",
                                    errors.password ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50/50"
                                )}
                                placeholder="••••••••"
                            />
                            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                        </div>

                        <div className="flex justify-end">
                            <a href="#" className="text-xs font-semibold text-gray-500 hover:text-yellow-600">Forgot Password?</a>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold py-4 rounded-xl shadow-lg shadow-yellow-400/30 transform transition-all hover:scale-[1.02] active:scale-[0.98] mt-2"
                        >
                            {isSubmitting ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </motion.div>
            </main>
        </div>
    );
};

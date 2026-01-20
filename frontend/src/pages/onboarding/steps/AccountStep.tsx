import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthService } from '../../../services/auth.service';
import clsx from 'clsx';

const schema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be 8+ chars")
        .regex(/[A-Z]/, "Needs uppercase letter")
        .regex(/[0-9]/, "Needs a number")
        .regex(/[^A-Za-z0-9]/, "Needs special char"),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export const AccountStep = ({ onNext }: { onNext: (data: any) => void }) => {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema)
    });

    const onSubmit = async (data: FormData) => {
        try {
            // Call API to create account
            const signupResponse = await AuthService.signup({
                email: data.email,
                password: data.password,
                name: data.name
            });

            // Check if we got a session directly from signup
            // (happens when email confirmation is disabled in Supabase)
            if (signupResponse.data?.session) {
                localStorage.setItem('safeguard_token', signupResponse.data.session.access_token);
                onNext({ name: data.name, email: data.email });
                return;
            }

            // If no session, try login (user might already exist and be confirmed)
            try {
                await AuthService.login({ email: data.email, password: data.password });
                onNext({ name: data.name, email: data.email });
            } catch (loginErr) {
                // Login failed - likely email confirmation required
                alert('Account created! Please check your email to confirm your account, then log in.');
                // Could redirect to login page instead
            }
        } catch (err: any) {
            const message = err.response?.data?.message || 'Signup failed. Please try again.';
            alert(message);
            console.error(err);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Name</label>
                <input
                    {...register('name')}
                    className={clsx("w-full px-4 py-3 rounded-xl border focus:ring-4 focus:ring-yellow-200 focus:border-yellow-400 transition-all outline-none",
                        errors.name ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50/50"
                    )}
                    placeholder="e.g. Super Mom"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

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

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                    type="password"
                    {...register('confirmPassword')}
                    className={clsx("w-full px-4 py-3 rounded-xl border focus:ring-4 focus:ring-yellow-200 focus:border-yellow-400 transition-all outline-none",
                        errors.confirmPassword ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50/50"
                    )}
                    placeholder="••••••••"
                />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold py-4 rounded-xl shadow-lg shadow-yellow-400/30 transform transition-all hover:scale-[1.02] active:scale-[0.98] mt-6"
            >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>

            <p className="text-xs text-center text-gray-500 mt-4">
                By creating an account, you agree to our <a href="#" className="text-yellow-600 font-semibold underline">Child Safety Policy</a>.
            </p>
        </form>
    );
};

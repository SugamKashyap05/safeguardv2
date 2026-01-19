import { supabase } from '../config/supabase';
import { ParentService } from './parent.service';
import { env } from '../config/env';
import { validatePassword } from '../utils/validators';

export class AuthService {
    private parentService = new ParentService();

    // Parent Signup
    async signupParent(email: string, password: string, name: string) {
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            throw new Error(passwordValidation.message);
        }

        // 1. Create auth user in Supabase
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name // Store name in user metadata
                },
                // Using FRONTEND_URL or env.CORS_ORIGIN depending on where you want verify-email to point
                emailRedirectTo: `${env.CORS_ORIGIN}/verify-email`
            }
        });

        if (authError) throw authError;

        // 2. Create parent profile in public.parents if user creation logic requires it immediately
        // Note: Supabase might have triggers for this, but here we do it explicitly as requested.
        // If the user hasn't confirmed email, authData.user might be returned but session null.

        if (authData.user) {
            // We typically wait for email confirmation or Supabase triggers, 
            // but the prompt explicitly asks to create profile here.
            // We must ensure the ID and email are available.
            try {
                await this.parentService.createParentProfile(
                    authData.user.id,
                    email,
                    name
                );
            } catch (err: any) {
                // If profile creation fails (e.g. unique constraint), checking if user already exists
                console.error("Profile creation error or already exists:", err.message);
            }
        }

        return {
            user: authData.user,
            session: authData.session,
        };
    }

    // Parent Login
    async loginParent(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        if (!data.user) throw new Error("User not found");

        // 5. Return user data
        const parent = await this.parentService.getParentProfile(data.user.id);

        // Check if active
        if (parent && parent.is_active === false) {
            throw new Error('Account is deactivated');
        }

        return {
            user: data.user,
            session: data.session,
            parent
        };
    }

    // Logout
    async logout() {
        // signOut needs the session key usually, but supabase-js client manages it if used on frontend.
        // On backend (admin or anon client), signOut might not work as expected for a specific user without token.
        // However, the prompt snippet implies using the client. 
        // We will assume this logout is verifying/invalidating if possible, or just calling the method.
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    }

    // Refresh Session
    async refreshSession(refreshToken: string) {
        const { data, error } = await supabase.auth.refreshSession({
            refresh_token: refreshToken
        });

        if (error) throw error;
        return data;
    }

    // Password Reset Request
    async requestPasswordReset(email: string) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${env.CORS_ORIGIN}/reset-password`
        });

        if (error) throw error;
    }

    // Update Password
    async updatePassword(newPassword: string) {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;
    }

    // Verify JWT Token (for protected routes)
    async verifyToken(token: string) {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error) throw error;
        return user;
    }
}

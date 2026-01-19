import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { ChildAuthService } from '../services/child-auth.service';
import { ApiResponse } from '../utils/response';
import { HTTP_STATUS } from '../utils/httpStatus';

const authService = new AuthService();
const childAuthService = new ChildAuthService();

export class AuthController {
    /**
     * Parent Signup
     * POST /api/v1/auth/parent/signup
     */
    static async signupParent(req: Request, res: Response) {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return ApiResponse.error(res, 'Missing required fields', HTTP_STATUS.BAD_REQUEST);
        }

        try {
            const result = await authService.signupParent(email, password, name);
            return ApiResponse.success(res, result, 'Parent registered successfully', HTTP_STATUS.CREATED);
        } catch (error: any) {
            return ApiResponse.error(res, error.message, HTTP_STATUS.BAD_REQUEST);
        }
    }

    /**
     * Parent Login
     * POST /api/v1/auth/parent/login
     */
    static async loginParent(req: Request, res: Response) {
        const { email, password } = req.body;

        if (!email || !password) {
            return ApiResponse.error(res, 'Email and password required', HTTP_STATUS.BAD_REQUEST);
        }

        try {
            const result = await authService.loginParent(email, password);
            return ApiResponse.success(res, result, 'Login successful');
        } catch (error: any) {
            // Return 401 for login failures
            return ApiResponse.error(res, error.message || 'Invalid credentials', HTTP_STATUS.UNAUTHORIZED);
        }
    }

    /**
     * Parent Logout
     * POST /api/v1/auth/parent/logout
     */
    static async logoutParent(req: Request, res: Response) {
        try {
            await authService.logout();
            return ApiResponse.success(res, null, 'Logged out successfully');
        } catch (error: any) {
            return ApiResponse.error(res, error.message, HTTP_STATUS.BAD_REQUEST);
        }
    }

    /**
     * Refresh Session
     * POST /api/v1/auth/refresh
     */
    static async refreshToken(req: Request, res: Response) {
        // Typically session is managed by Supabase client in frontend, 
        // but if we need a server-side refresh, we proxy it or use cookies.
        // For now, let's assume client sends refresh token or we just return success if valid?
        // Actually, standard Supabase use calls `supabase.auth.refreshSession()`.
        // We'll wrap it for completeness if the user sends `{ refresh_token }`

        const { refresh_token } = req.body;
        if (!refresh_token) {
            return ApiResponse.error(res, 'Refresh Token required', HTTP_STATUS.BAD_REQUEST);
        }

        try {
            const data = await authService.refreshSession(refresh_token);
            return ApiResponse.success(res, data, 'Session refreshed');
        } catch (error: any) {
            return ApiResponse.error(res, error.message, HTTP_STATUS.UNAUTHORIZED);
        }
    }

    /**
     * Child Login (PIN)
     * POST /api/v1/auth/child/login
     */
    static async loginChild(req: Request, res: Response) {
        const { childId, pin } = req.body;

        if (!childId || !pin) {
            return ApiResponse.error(res, 'Child ID and PIN required', HTTP_STATUS.BAD_REQUEST);
        }

        const result = await childAuthService.loginChild(childId, pin);
        return ApiResponse.success(res, result, 'Child logged in successfully');
    }
}

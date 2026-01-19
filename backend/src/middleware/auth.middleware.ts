import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { ChildAuthService } from '../services/child-auth.service';
import { ApiResponse } from '../utils/response';
import { HTTP_STATUS } from '../utils/httpStatus';

const authService = new AuthService();
const childAuthService = new ChildAuthService();

export const requireParent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return ApiResponse.error(res, 'Authorization token missing', HTTP_STATUS.UNAUTHORIZED);
        }

        const token = authHeader.split(' ')[1];
        const user = await authService.verifyToken(token);

        if (!user) {
            return ApiResponse.error(res, 'Invalid token', HTTP_STATUS.UNAUTHORIZED);
        }

        // Attach user to request
        req.user = user;

        // Check if we need to fetch full parent profile? 
        // Usually handled by controller if needed, but we can verify role here if expanding.

        next();
    } catch (error: any) {
        return ApiResponse.error(res, 'Authentication failed: ' + error.message, HTTP_STATUS.UNAUTHORIZED);
    }
};

export const requireChild = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return ApiResponse.error(res, 'Child Session token missing', HTTP_STATUS.UNAUTHORIZED);
        }

        const token = authHeader.split(' ')[1];
        const decoded = await childAuthService.verifyChildToken(token);

        if (!decoded) {
            return ApiResponse.error(res, 'Invalid child session', HTTP_STATUS.UNAUTHORIZED);
        }

        req.child = {
            id: decoded.childId,
            name: decoded.name, // If name is in token, else just ID
            age: decoded.age,
            parentId: decoded.parentId
        };

        next();
    } catch (error: any) {
        return ApiResponse.error(res, 'Child Auth failed: ' + error.message, HTTP_STATUS.UNAUTHORIZED);
    }
};

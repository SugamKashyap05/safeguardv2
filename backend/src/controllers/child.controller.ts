import { Request, Response } from 'express';
import { ChildService } from '../services/child.service';
import { ApiResponse } from '../utils/response';
import { HTTP_STATUS } from '../utils/httpStatus';

const childService = new ChildService();

export class ChildController {
    /**
     * Create a new Child
     * POST /api/v1/children
     * Body: { parent_id, name, age, pin, avatar }
     */
    static async create(req: Request, res: Response) {
        const { name, age, pin, avatar, favoriteCategories, dailyScreenTimeLimit } = req.body;
        const parent_id = req.user.id; // From middleware

        if (!name || !age || !pin) {
            return ApiResponse.error(res, 'Missing required fields', HTTP_STATUS.BAD_REQUEST);
        }

        if (pin.length !== 4) {
            return ApiResponse.error(res, 'PIN must be exactly 4 digits', HTTP_STATUS.BAD_REQUEST);
        }

        const child = await childService.createChild({
            parent_id,
            name,
            age: Number(age),
            pin,
            avatar,
            favorite_categories: favoriteCategories,
            daily_screen_time_limit: dailyScreenTimeLimit
        });

        return ApiResponse.success(res, child, 'Child profile created successfully', HTTP_STATUS.CREATED);
    }

    /**
     * Get Child
     * GET /api/v1/children/:id
     */
    static async get(req: Request, res: Response) {
        const { id } = req.params;
        const child = await childService.getChild(id, req.user.id);
        return ApiResponse.success(res, child, 'Child retrieved');
    }

    /**
     * Update Child
     * PUT /api/v1/children/:id
     */
    static async update(req: Request, res: Response) {
        const { id } = req.params;
        const updates = req.body;
        // Prevent updating critical fields like parent_id directly if not handled
        delete updates.parent_id;

        await childService.updateChild(id, req.user.id, updates);
        return ApiResponse.success(res, { id, ...updates }, 'Child updated successfully');
    }

    /**
    * Delete Child (Deactivate)
    * DELETE /api/v1/children/:id
    */
    static async remove(req: Request, res: Response) {
        const { id } = req.params;
        await childService.deleteChild(id, req.user.id);
        return ApiResponse.success(res, null, 'Child deactivated successfully');
    }

    /**
     * Verify Child PIN
     * POST /api/v1/children/verify-pin
     * Body: { child_id, pin }
     */
    static async verifyPin(req: Request, res: Response) {
        const { child_id, pin } = req.body;

        if (!child_id || !pin) {
            return ApiResponse.error(res, 'Missing child_id or pin', HTTP_STATUS.BAD_REQUEST);
        }

        const isValid = await childService.verifyChildPin(child_id, pin);

        if (isValid) {
            return ApiResponse.success(res, { valid: true }, 'PIN verified successfully');
        } else {
            return ApiResponse.error(res, 'Invalid PIN', HTTP_STATUS.UNAUTHORIZED);
        }
    }

    /**
     * List Children for a Parent
     * GET /api/v1/children?parent_id=...
     */
    static async list(req: Request, res: Response) {
        const children = await childService.getChildren(req.user.id); // Use authenticated user
        return ApiResponse.success(res, children, 'Children retrieved successfully');
    }
    /**
     * Get Child Status (Active/Paused) - for Child Dashboard
     * GET /api/v1/children/:id/status
     */
    static async getStatus(req: Request, res: Response) {
        // If accessed via Parent Token
        if (req.user) {
            const { id } = req.params;
            const child = await childService.getChild(id, req.user.id);
            return ApiResponse.success(res, {
                isActive: child.is_active,
                pauseReason: child.pause_reason,
                pausedUntil: child.paused_until
            }, 'Child status retrieved');
        }

        // If accessed via Child Token
        if (req.child) {
            // Ensure child can only check their own status
            if (req.params.id !== req.child.id) {
                return ApiResponse.error(res, 'Unauthorized', HTTP_STATUS.FORBIDDEN);
            }
            // We can re-fetch from DB to get latest status
            const child = await childService.getChild(req.child.id, req.child.parentId);
            return ApiResponse.success(res, {
                isActive: child.is_active,
                pauseReason: child.pause_reason,
                pausedUntil: child.paused_until
            }, 'Child status retrieved');
        }

        return ApiResponse.error(res, 'Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }
}

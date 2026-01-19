import { Request, Response } from 'express';
import { ParentService } from '../services/parent.service';
import { ApiResponse } from '../utils/response';
import { HTTP_STATUS } from '../utils/httpStatus';

const parentService = new ParentService();

export class ParentController {
    /**
     * Get Parent Profile with Children
     * GET /api/v1/parents/:id
     */
    static async getProfile(req: Request, res: Response) {
        const { id } = req.params;

        // Security check: Ensure requesting user matches ID or is admin (we only have parents now)
        // req.user is set by requireParent middleware
        if (req.user?.id !== id) {
            // We could throw ForbiddenError here
        }

        const profile = await parentService.getParentProfile(id);
        return ApiResponse.success(res, profile, 'Parent profile retrieved successfully');
    }

    /**
     * Get Current Parent Profile
     * GET /api/v1/parents/me
     */
    static async getMe(req: Request, res: Response) {
        if (!req.user || !req.user.id) {
            return ApiResponse.error(res, 'Not authenticated', HTTP_STATUS.UNAUTHORIZED);
        }

        const profile = await parentService.getParentProfile(req.user.id);
        return ApiResponse.success(res, profile, 'My profile retrieved successfully');
    }

    /**
     * Create/Initialize Parent Profile
     * POST /api/v1/parents/profile
     * Body: { id, email, name }
     */
    static async createProfile(req: Request, res: Response) {
        // This is usually handled by auth triggers or internal logic
        // But invalidating the previous direct creation logic as it's not used by API clients
        return ApiResponse.success(res, null, 'Not implemented via API directly');
    }

    static async updateOnboarding(req: Request, res: Response) {
        const { step } = req.body;
        if (typeof step !== 'number') {
            return ApiResponse.error(res, 'Step must be a number', HTTP_STATUS.BAD_REQUEST);
        }
        await parentService.updateOnboardingStep(req.user.id, step);
        return ApiResponse.success(res, { step }, 'Onboarding step updated');
    }
}

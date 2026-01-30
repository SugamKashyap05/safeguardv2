
import { Request, Response, NextFunction } from 'express';
import { gamificationService } from '../services/gamification.service';
import { AppError } from '../utils/AppError';
import { HTTP_STATUS } from '../utils/httpStatus';

export class GamificationController {

    async getChildBadges(req: Request, res: Response, next: NextFunction) {
        try {
            const childId = req.params.childId; // Assuming validated by middleware
            // In a real app, verify parent or child access rights here.

            const badges = await gamificationService.getBadges(childId);
            res.status(HTTP_STATUS.OK).json({
                status: 'success',
                data: badges
            });
        } catch (error) {
            next(error);
        }
    }

    // Dev/Test endpoint to manually award stars
    async awardStars(req: Request, res: Response, next: NextFunction) {
        try {
            const { childId, amount, reason } = req.body;
            const result = await gamificationService.awardStars(childId, amount, reason);
            res.status(HTTP_STATUS.OK).json({
                status: 'success',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}

export const gamificationController = new GamificationController();


import { Request, Response, NextFunction } from 'express';
import { questService } from '../services/quest.service';
import { HTTP_STATUS } from '../utils/httpStatus';

export class QuestController {
    async getDailyQuests(req: Request, res: Response, next: NextFunction) {
        try {
            const childId = req.params.childId;
            const quests = await questService.getDailyQuests(childId);
            res.status(HTTP_STATUS.OK).json({
                status: 'success',
                data: quests
            });
        } catch (error) {
            next(error);
        }
    }

    // Internal/Dev endpoint to trigger progress manually
    async debugProgress(req: Request, res: Response, next: NextFunction) {
        try {
            const { childId, type, amount } = req.body;
            await questService.updateProgress(childId, type, amount);
            res.status(HTTP_STATUS.OK).json({ status: 'success' });
        } catch (error) {
            next(error);
        }
    }
}

export const questController = new QuestController();

import { Request, Response } from 'express';
// @ts-ignore
import { RecommendationService } from '../services/recommendation.service';
import { ApiResponse } from '../utils/response';
import { asyncWrapper } from '../utils/asyncWrapper'; // Ensure correct import

const service = new RecommendationService();

export class RecommendationController {

    static async getPersonalized(req: Request, res: Response) {
        const { childId } = req.params;
        const result = await service.getPersonalized(childId);
        return ApiResponse.success(res, result);
    }

    static async getEducational(req: Request, res: Response) {
        const { childId } = req.params;
        const result = await service.getEducational(childId);
        return ApiResponse.success(res, result);
    }

    static async getTrending(req: Request, res: Response) {
        const { childId } = req.params;
        const result = await service.getTrending(childId);
        return ApiResponse.success(res, result);
    }

    static async getByCategory(req: Request, res: Response) {
        const { childId, category } = req.params;
        const result = await service.getByCategory(childId, category);
        return ApiResponse.success(res, result);
    }
}

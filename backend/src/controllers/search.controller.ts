import { Request, Response } from 'express';
// @ts-ignore
import { SafeSearchService } from '../services/safe-search.service';
import { ApiResponse } from '../utils/response';

const service = new SafeSearchService();

export class SearchController {

    static async search(req: Request, res: Response) {
        const { q, childId } = req.query;
        if (!q) return ApiResponse.success(res, []);

        const results = await service.searchVideos(q as string, childId as string);
        return ApiResponse.success(res, results);
    }

    static async getHistory(req: Request, res: Response) {
        const { childId } = req.params;
        const results = await service.getHistory(childId);
        return ApiResponse.success(res, results);
    }

    static async getSuggestions(req: Request, res: Response) {
        const { childId } = req.params;
        const results = await service.getSuggestions(childId);
        return ApiResponse.success(res, results);
    }
}

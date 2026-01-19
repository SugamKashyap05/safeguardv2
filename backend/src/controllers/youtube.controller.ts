import { Request, Response } from 'express';
import { YouTubeService } from '../services/youtube.service';
import { ApiResponse } from '../utils/response';
import { HTTP_STATUS } from '../utils/httpStatus';

const youtubeService = new YouTubeService();

export class YouTubeController {
    static async search(req: Request, res: Response) {
        const { q, childId } = req.query; // childId for personalized logs/filtering in future
        if (!q) return ApiResponse.error(res, 'Query required', HTTP_STATUS.BAD_REQUEST);

        const results = await youtubeService.searchVideos(String(q), 'all');
        return ApiResponse.success(res, results, 'Search results found');
    }

    static async getVideo(req: Request, res: Response) {
        const { id } = req.params;
        const details = await youtubeService.getVideoDetails(id);
        const safety = await youtubeService.checkVideoSafety(id);

        return ApiResponse.success(res, { ...details, safety }, 'Video details retrieved');
    }
}

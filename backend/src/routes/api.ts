import { Router } from 'express';
import { YouTubeService } from '../services/youtube.service';

const router = Router();
const youtubeService = new YouTubeService();

router.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

router.get('/videos/search', async (req, res) => {
    try {
        const query = req.query.q as string;
        if (!query) {
            return res.status(400).json({ error: 'Query parameter required' });
        }
        const results = await youtubeService.searchVideos(query);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Failed to search videos' });
    }
});

export default router;

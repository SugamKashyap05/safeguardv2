import { Router } from 'express';
// @ts-ignore
import { YouTubeController } from '../../controllers/youtube.controller';
import { asyncWrapper } from '../../utils/asyncWrapper';
import { requireParent } from '../../middleware/auth.middleware';

const router = Router();

// Assuming Parent OR Child can search. 
// If Child context, we might verifying session token
// For now, let's protect it generally or allow public if it's strictly filtered
// The summary says "GET /api/v1/youtube/search?childId=xxx" implying child usage
router.get('/search', asyncWrapper(YouTubeController.search));
router.get('/video/:id', asyncWrapper(YouTubeController.getVideo));

export default router;

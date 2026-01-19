import { Router } from 'express';
// @ts-ignore
import { RecommendationController } from '../../controllers/recommendation.controller';
import { asyncWrapper } from '../../utils/asyncWrapper';

const router = Router();

// Public/Child Endpoints (could be protected by session token in real app)
router.get('/:childId/personalized', asyncWrapper(RecommendationController.getPersonalized));
router.get('/:childId/educational', asyncWrapper(RecommendationController.getEducational));
router.get('/:childId/trending', asyncWrapper(RecommendationController.getTrending));
router.get('/:childId/category/:category', asyncWrapper(RecommendationController.getByCategory));

export default router;

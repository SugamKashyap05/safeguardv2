import { Router } from 'express';
import { gamificationController } from '../../controllers/gamification.controller';
import { asyncWrapper } from '../../utils/asyncWrapper';
// Import auth middleware if needed, e.g. requireParent

const router = Router();

router.get('/:childId/badges', asyncWrapper(gamificationController.getChildBadges.bind(gamificationController)));
router.post('/stars', asyncWrapper(gamificationController.awardStars.bind(gamificationController)));

export default router;

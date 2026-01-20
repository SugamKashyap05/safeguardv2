import { Router } from 'express';
import { AnalyticsController } from '../../controllers/analytics.controller';
import { requireParent } from '../../middleware/auth.middleware';
import { asyncWrapper } from '../../utils/asyncWrapper';

const router = Router();

// All analytics routes require parent auth
router.get('/child/:childId', requireParent, asyncWrapper(AnalyticsController.getChildAnalytics));
router.get('/parent/dashboard', requireParent, asyncWrapper(AnalyticsController.getParentDashboard));
router.get('/insights/:childId', requireParent, asyncWrapper(AnalyticsController.getInsights));

export default router;

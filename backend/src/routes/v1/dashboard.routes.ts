import { Router } from 'express';
// @ts-ignore
import { DashboardController } from '../../controllers/dashboard.controller';
import { asyncWrapper } from '../../utils/asyncWrapper';
import { requireParent } from '../../middleware/auth.middleware';

const router = Router();

router.get('/stats', requireParent, asyncWrapper(DashboardController.getStats));
router.get('/activity', requireParent, asyncWrapper(DashboardController.getActivity));

export default router;

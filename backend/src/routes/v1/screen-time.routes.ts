import { Router } from 'express';
// @ts-ignore
import { ScreenTimeController } from '../../controllers/screen-time.controller';
import { asyncWrapper } from '../../utils/asyncWrapper';
import { requireParent } from '../../middleware/auth.middleware';

const router = Router();

// Parent Access
router.get('/:childId', requireParent, asyncWrapper(ScreenTimeController.getRules));
router.put('/:childId', requireParent, asyncWrapper(ScreenTimeController.updateRules));
router.post('/:childId/extend', requireParent, asyncWrapper(ScreenTimeController.extendTime));
router.post('/:childId/pause', requireParent, asyncWrapper(ScreenTimeController.pause));
router.post('/:childId/resume', requireParent, asyncWrapper(ScreenTimeController.resume));

// Public/Child Access (with ID or token - currently just ID for simplicity of loop)
router.get('/:childId/remaining', asyncWrapper(ScreenTimeController.getRemaining));

export default router;

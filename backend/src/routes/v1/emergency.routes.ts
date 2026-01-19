import { Router } from 'express';
// @ts-ignore
import { EmergencyController } from '../../controllers/emergency.controller';
import { asyncWrapper } from '../../utils/asyncWrapper';
import { requireParent } from '../../middleware/auth.middleware';

const router = Router();

router.use(requireParent);

router.post('/pause/:childId', asyncWrapper(EmergencyController.pauseChild));
router.post('/resume/:childId', asyncWrapper(EmergencyController.resumeChild));
router.post('/panic-pause', asyncWrapper(EmergencyController.panicPause));
router.post('/block-content', asyncWrapper(EmergencyController.blockContent));

export default router;

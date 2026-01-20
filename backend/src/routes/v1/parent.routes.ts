import { Router } from 'express';
import { ParentController } from '../../controllers/parent.controller';
import { asyncWrapper } from '../../utils/asyncWrapper';
import { requireParent } from '../../middleware/auth.middleware';

const router = Router();

router.get('/me', requireParent, asyncWrapper(ParentController.getMe)); // Must be before /:id
router.put('/onboarding', requireParent, asyncWrapper(ParentController.updateOnboarding));

// Settings Routes
router.get('/settings', requireParent, asyncWrapper(ParentController.getSettings));
router.put('/settings', requireParent, asyncWrapper(ParentController.updateSettings));
router.post('/change-password', requireParent, asyncWrapper(ParentController.changePassword));

router.get('/:id', requireParent, asyncWrapper(ParentController.getProfile));
router.post('/profile', requireParent, asyncWrapper(ParentController.createProfile));

export default router;

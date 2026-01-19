import { Router } from 'express';
import { ParentController } from '../../controllers/parent.controller';
import { asyncWrapper } from '../../utils/asyncWrapper';
import { requireParent } from '../../middleware/auth.middleware';

const router = Router();

router.get('/me', requireParent, asyncWrapper(ParentController.getMe)); // Must be before /:id
router.put('/onboarding', requireParent, asyncWrapper(ParentController.updateOnboarding));
router.get('/:id', requireParent, asyncWrapper(ParentController.getProfile));
router.post('/profile', requireParent, asyncWrapper(ParentController.createProfile));

export default router;

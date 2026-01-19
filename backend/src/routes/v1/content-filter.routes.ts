import { Router } from 'express';
// @ts-ignore
import { ContentFilterController } from '../../controllers/content-filter.controller';
import { asyncWrapper } from '../../utils/asyncWrapper';
import { requireParent } from '../../middleware/auth.middleware';

const router = Router();

// Check endpoint might be called by Chilld context? 
// For now, assuming Parent or Internal use, or Child with Token.
// Check Video (Public or Protected?) -> Let's make it public/protected by Child Token ideally.
// But for this sprint, we treat it as protected by Parent for config, or just open for the checking logic if we pass childId.
// We'll protect basic checking with generic Wrapper or leave open if Child FE calls it.
router.post('/check-video', asyncWrapper(ContentFilterController.checkVideo));

// Management (Parent Only)
router.get('/:childId', requireParent, asyncWrapper(ContentFilterController.getSettings));
router.put('/:childId', requireParent, asyncWrapper(ContentFilterController.updateSettings));

router.post('/channels/approve', requireParent, asyncWrapper(ContentFilterController.approveChannel));
router.post('/videos/block', requireParent, asyncWrapper(ContentFilterController.blockVideo));

export default router;

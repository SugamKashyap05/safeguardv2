import { Router } from 'express';
// @ts-ignore
import { WatchController } from '../../controllers/watch.controller';
import { asyncWrapper } from '../../utils/asyncWrapper';
import { requireParent, requireChild } from '../../middleware/auth.middleware';

const router = Router();

// Child Actions (Should be protected by child token ideally, currently public or session based)
router.post('/start', asyncWrapper(WatchController.start));
router.patch('/:id/update', asyncWrapper(WatchController.update));
router.post('/:id/complete', asyncWrapper(WatchController.complete));

// Child Self-Access
router.get('/history/me', requireChild, asyncWrapper(WatchController.getMyHistory));

// Parent Actions
router.get('/history/:childId', requireParent, asyncWrapper(WatchController.getHistory));
router.get('/history/:childId/stats', requireParent, asyncWrapper(WatchController.getStats));

export default router;

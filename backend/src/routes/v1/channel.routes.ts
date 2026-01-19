import { Router } from 'express';
// @ts-ignore
import { ChannelController } from '../../controllers/channel.controller';
import { asyncWrapper } from '../../utils/asyncWrapper';
import { requireParent } from '../../middleware/auth.middleware';

const router = Router();

// Parent Routes
router.get('/approved/:childId', requireParent, asyncWrapper(ChannelController.getApproved));
router.get('/pending/:childId', requireParent, asyncWrapper(ChannelController.getPending));
router.post('/approve', requireParent, asyncWrapper(ChannelController.approve));
router.post('/direct-approve', requireParent, asyncWrapper(ChannelController.directApprove));
router.post('/reject', requireParent, asyncWrapper(ChannelController.reject));
router.delete('/:channelId/:childId', requireParent, asyncWrapper(ChannelController.remove));
router.get('/discover', requireParent, asyncWrapper(ChannelController.discover));

// Child Routes (Public/Session)
router.post('/request', asyncWrapper(ChannelController.request));

export default router;

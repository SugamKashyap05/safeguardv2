
import { Router } from 'express';
import { DeviceController } from '../../controllers/device.controller';
import { asyncWrapper } from '../../utils/asyncWrapper';
import { requireParent, requireChild } from '../../middleware/auth.middleware';

const router = Router();

// Parent Routes
router.get('/:childId', requireParent, asyncWrapper(DeviceController.list));
router.delete('/:deviceId', requireParent, asyncWrapper(DeviceController.remove));
router.post('/:deviceId/pause', requireParent, asyncWrapper(DeviceController.togglePause));

// Child Routes
router.post('/:childId/register', requireChild, asyncWrapper(DeviceController.register));
router.get('/:childId/sync/session', requireChild, asyncWrapper(DeviceController.getActiveSession)); // Sync check

export default router;

import { Router } from 'express';
// @ts-ignore
import { NotificationController } from '../../controllers/notification.controller';
import { asyncWrapper } from '../../utils/asyncWrapper';
import { requireParent } from '../../middleware/auth.middleware';

const router = Router();

// Retrieve
router.get('/', requireParent, asyncWrapper(NotificationController.getAll));
router.get('/unread-count', requireParent, asyncWrapper(NotificationController.getUnreadCount));

// Actions
router.patch('/mark-all-read', requireParent, asyncWrapper(NotificationController.markAllRead));
router.patch('/:id/read', requireParent, asyncWrapper(NotificationController.markRead));
router.delete('/:id', requireParent, asyncWrapper(NotificationController.delete));

// Test Endpoint
router.post('/test', requireParent, asyncWrapper(NotificationController.createTest));

export default router;

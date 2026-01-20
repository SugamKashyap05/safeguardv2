import { Router } from 'express';
import { ApprovalController } from '../../controllers/approval.controller';
import { requireParent, requireChild } from '../../middleware/auth.middleware';
import { asyncWrapper } from '../../utils/asyncWrapper';

const router = Router();

// Child routes (require child auth)
router.post('/request', requireChild, asyncWrapper(ApprovalController.requestApproval));

// Parent routes (require parent auth)
router.get('/pending', requireParent, asyncWrapper(ApprovalController.getPending));
router.get('/history', requireParent, asyncWrapper(ApprovalController.getHistory));
router.get('/count', requireParent, asyncWrapper(ApprovalController.getCount));
router.post('/:id/review', requireParent, asyncWrapper(ApprovalController.review));
router.post('/:id/quick-approve-channel', requireParent, asyncWrapper(ApprovalController.quickApproveChannel));
router.delete('/:id', requireParent, asyncWrapper(ApprovalController.dismiss));

export default router;

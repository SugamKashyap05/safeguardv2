import { Router } from 'express';
import { ChildController } from '../../controllers/child.controller';
import { asyncWrapper } from '../../utils/asyncWrapper';
import { requireParent } from '../../middleware/auth.middleware';

const router = Router();

// Create Child (Requires Parent Auth)
router.post('/', requireParent, asyncWrapper(ChildController.create));

// List Children (Requires Parent Auth)
router.post('/', requireParent, asyncWrapper(ChildController.create));
router.get('/', requireParent, asyncWrapper(ChildController.list));
router.get('/:id', requireParent, asyncWrapper(ChildController.get));
router.put('/:id', requireParent, asyncWrapper(ChildController.update));
router.delete('/:id', requireParent, asyncWrapper(ChildController.remove));

// Verify PIN (Public/Child Context - creates session)
router.post('/verify-pin', asyncWrapper(ChildController.verifyPin));

export default router;

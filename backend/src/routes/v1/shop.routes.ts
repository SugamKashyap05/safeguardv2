
import { Router } from 'express';
import { shopController } from '../../controllers/shop.controller';
import { asyncWrapper } from '../../utils/asyncWrapper';

const router = Router();

router.get('/items', shopController.getItems);
router.get('/:childId/inventory', asyncWrapper(shopController.getInventory.bind(shopController)));
router.post('/:childId/buy', asyncWrapper(shopController.buyItem.bind(shopController)));
router.post('/:childId/avatar', asyncWrapper(shopController.saveAvatar.bind(shopController)));

export default router;

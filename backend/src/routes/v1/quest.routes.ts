
import { Router } from 'express';
import { questController } from '../../controllers/quest.controller';
import { asyncWrapper } from '../../utils/asyncWrapper';

const router = Router();

router.get('/:childId', asyncWrapper(questController.getDailyQuests.bind(questController)));
router.post('/debug/progress', asyncWrapper(questController.debugProgress.bind(questController)));

export default router;

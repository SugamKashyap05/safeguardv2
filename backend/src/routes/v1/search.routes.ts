import { Router } from 'express';
// @ts-ignore
import { SearchController } from '../../controllers/search.controller';
import { asyncWrapper } from '../../utils/asyncWrapper';

const router = Router();

// Public/Child Endpoints (could be protected)
router.get('/', asyncWrapper(SearchController.search));
router.get('/history/:childId', asyncWrapper(SearchController.getHistory));
router.get('/suggestions/:childId', asyncWrapper(SearchController.getSuggestions));

export default router;

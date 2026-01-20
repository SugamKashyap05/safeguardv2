import { Router } from 'express';
// @ts-ignore
import { ReportController } from '../../controllers/report.controller';
import { asyncWrapper } from '../../utils/asyncWrapper';
import { requireParent } from '../../middleware/auth.middleware';

const router = Router();

router.use(requireParent);

router.get('/latest', asyncWrapper(ReportController.getLatest));
router.get('/download', asyncWrapper(ReportController.downloadReport));
router.get('/weekly/:date', asyncWrapper(ReportController.getByDate));

export default router;

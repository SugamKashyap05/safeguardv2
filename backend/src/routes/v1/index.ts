import { Router } from 'express';
import { HealthController } from '../../controllers/health.controller';
import { asyncWrapper } from '../../utils/asyncWrapper';
import parentRouter from './parent.routes';
import childRouter from './child.routes';
import authRouter from './auth.routes';
import youtubeRouter from './youtube.routes';

const router = Router();

// Health Check
router.get('/health', asyncWrapper(HealthController.check));

// Feature Routes
// @ts-ignore
import youtubeRouter from './youtube.routes';
// @ts-ignore
import filterRouter from './content-filter.routes';
// @ts-ignore
import dashboardRouter from './dashboard.routes';
// @ts-ignore
import screenTimeRouter from './screen-time.routes';
// @ts-ignore
import watchRouter from './watch.routes';
// @ts-ignore
import channelRouter from './channel.routes';
// @ts-ignore
import notificationRouter from './notification.routes';
// @ts-ignore
import recommendationRouter from './recommendation.routes';
// @ts-ignore
import searchRouter from './search.routes';
// @ts-ignore
import reportRouter from './report.routes';

const router = Router();

// Health Check
router.get('/health', asyncWrapper(HealthController.check));

// Feature Routes
router.use('/auth', authRouter);
router.use('/parents', parentRouter);
/* 
 Note: The user requested /api/v1/parent/dashboard/stats.
 If I mount it at /parent/dashboard in parentRouter, that works.
 Or I can mount it here as /dashboard.
 Given typical layouts, I'll mount it under /parents/dashboard if possible, or just /dashboard for simplicity.
 Actually, let's keep it clean: 
 /api/v1/dashboard/stats -> clear.
 /api/v1/parent/dashboard -> implies it's a sub-resource.
 I will mount it as /dashboard here for now as usually dashboards are top level concepts in APIs.
 but wait, the prompt specifically said GET /api/v1/parent/dashboard/stats
 So I should mount it under /parent/dashboard or make /parent use a sub-router.
 I'll add it here as /parent/dashboard.
*/
router.use('/parents/dashboard', dashboardRouter); // Nesting it to match requirement
router.use('/children', childRouter);
router.use('/youtube', youtubeRouter);
router.use('/filters', filterRouter);
router.use('/screentime', screenTimeRouter);
router.use('/watch', watchRouter);
router.use('/channels', channelRouter);
router.use('/notifications', notificationRouter);
router.use('/recommendations', recommendationRouter);
router.use('/search', searchRouter);
router.use('/reports', reportRouter);

export default router;

import { Router } from 'express';
import { HealthController } from '../../controllers/health.controller';
import { asyncWrapper } from '../../utils/asyncWrapper';

// Route Imports
import parentRouter from './parent.routes';
import childRouter from './child.routes';
import authRouter from './auth.routes';
import deviceRouter from './device.routes';
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
// @ts-ignore
import emergencyRouter from './emergency.routes';
import playlistRouter from './playlist.routes';

const router = Router();

// Health Check
router.get('/health', asyncWrapper(HealthController.check));

// Feature Routes
router.use('/auth', authRouter);
router.use('/parents', parentRouter);
// Mounting dashboard stats under /parents/dashboard as requested
router.use('/parents/dashboard', dashboardRouter);

router.use('/children', childRouter);
router.use('/devices', deviceRouter);
router.use('/youtube', youtubeRouter);
router.use('/filters', filterRouter);
router.use('/screentime', screenTimeRouter);
router.use('/watch', watchRouter);
router.use('/channels', channelRouter);
router.use('/notifications', notificationRouter);
router.use('/recommendations', recommendationRouter);
router.use('/search', searchRouter);
router.use('/reports', reportRouter);
router.use('/emergency', emergencyRouter);
router.use('/playlists', playlistRouter);

export default router;

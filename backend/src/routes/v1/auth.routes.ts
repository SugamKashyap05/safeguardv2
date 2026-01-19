import { Router } from 'express';
import { AuthController } from '../../controllers/auth.controller';
import { asyncWrapper } from '../../utils/asyncWrapper';

const router = Router();

// Parent Auth
router.post('/parent/signup', asyncWrapper(AuthController.signupParent));
router.post('/parent/login', asyncWrapper(AuthController.loginParent));
router.post('/parent/logout', asyncWrapper(AuthController.logoutParent));
router.post('/parent/refresh', asyncWrapper(AuthController.refreshToken)); // Added refresh

// Child Auth
router.post('/child/login', asyncWrapper(AuthController.loginChild));

export default router;

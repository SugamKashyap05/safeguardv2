import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import apiV1Router from './routes/v1/index';
import { ApiResponse } from './utils/response';
import { HTTP_STATUS } from './utils/httpStatus';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true
}));
app.use(express.json());

import { errorHandler } from './middleware/error.middleware';
import { NotFoundError } from './utils/AppError';

// Routes
app.use('/api/v1', apiV1Router);

// 404 Handler - Uses AppError
app.use((req, res, next) => {
    next(new NotFoundError(`Route ${req.originalUrl} not found`));
});

// Global Error Handler
app.use(errorHandler);

// Start Server
import { createServer } from 'http';
import { socketService } from './services/websocket.service';

const httpServer = createServer(app);
socketService.initialize(httpServer);

httpServer.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
});

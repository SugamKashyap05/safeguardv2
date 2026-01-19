import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { HTTP_STATUS } from '../utils/httpStatus';
import { env } from '../config/env';

export const errorHandler = (err: Error | AppError, req: Request, res: Response, next: NextFunction) => {
    let error = err;

    // Log the error
    console.error('SERVER ERROR:', err);

    if (!(error instanceof AppError)) {
        // Convert generic errors to AppError
        const statusCode = (error as any).statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
        const message = error.message || 'Internal Server Error';
        error = new AppError(message, statusCode);
    }

    const appError = error as AppError;

    const response: any = {
        success: false,
        message: appError.message,
        error: {
            statusCode: appError.statusCode,
            details: appError.details || []
        }
    };

    // Environment specifics
    if (env.NODE_ENV === 'development') {
        response.error.stack = appError.stack;
        response.error.raw = err; // Full raw error for debugging
    } else {
        // Production: Don't leak stack traces
        if (!appError.isOperational) {
            // If logic above failed to catch non-operational, or for robust safety:
            response.message = 'Something went wrong';
            response.error.details = undefined;
        }
    }

    res.status(appError.statusCode).json(response);
};

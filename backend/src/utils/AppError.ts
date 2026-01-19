import { HTTP_STATUS } from './httpStatus';

export class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean;
    public details?: any;

    constructor(message: string, statusCode: number, details?: any) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true; // Operational errors are trusted
        this.details = details;

        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message: string, details?: any) {
        super(message, HTTP_STATUS.BAD_REQUEST, details);
    }
}

export class AuthError extends AppError {
    constructor(message: string = 'Authentication failed') {
        super(message, HTTP_STATUS.UNAUTHORIZED);
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'Access denied') {
        super(message, HTTP_STATUS.FORBIDDEN);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = 'Resource not found') {
        super(message, HTTP_STATUS.NOT_FOUND);
    }
}

export class ServerError extends AppError {
    constructor(message: string = 'Internal server error', details?: any) {
        super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, details);
    }
}

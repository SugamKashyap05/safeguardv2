import { Response } from 'express';
import { HTTP_STATUS } from './httpStatus';

export interface IApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: any;
}

export class ApiResponse {
    static success<T>(res: Response, data: T, message: string = 'Success', statusCode: number = HTTP_STATUS.OK) {
        const response: IApiResponse<T> = {
            success: true,
            message,
            data,
        };
        return res.status(statusCode).json(response);
    }

    static error(res: Response, message: string = 'Internal Server Error', statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR, error?: any) {
        const response: IApiResponse = {
            success: false,
            message,
            error: process.env.NODE_ENV === 'development' ? error : undefined,
        };
        return res.status(statusCode).json(response);
    }
}

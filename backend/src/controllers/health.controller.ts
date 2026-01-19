import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { ApiResponse } from '../utils/response';
import { HTTP_STATUS } from '../utils/httpStatus';

export class HealthController {
    static async check(req: Request, res: Response) {
        let dbStatus = 'disconnected';

        try {
            // Check Supabase connection by making a lightweight query
            const { error } = await supabaseAdmin.from('parents').select('id').limit(1);
            if (!error) {
                dbStatus = 'connected';
            } else {
                dbStatus = `error: ${error.message}`;
            }
        } catch (err: any) {
            dbStatus = `error: ${err.message}`;
        }

        const healthData = {
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            database: dbStatus,
            env: process.env.NODE_ENV
        };

        return ApiResponse.success(res, healthData, 'System Healthy', HTTP_STATUS.OK);
    }
}

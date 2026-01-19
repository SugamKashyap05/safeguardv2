import { Request, Response } from 'express';
// @ts-ignore
import { ReportService } from '../services/report.service';
import { ApiResponse } from '../utils/response';

const service = new ReportService();

export class ReportController {

    static async getLatest(req: Request, res: Response) {
        // Calculate start of current week (e.g., Sunday or Monday)
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
        // Let's just say week starts on Monday? Or Sunday?
        // Simple approach: Last 7 days? Or actual calendar week?
        // User asked for "Week Date Range". Calendar week (Monday Start) is standard for business/schools.
        // Let's standardise on Monday.

        // Actually, let's just get "Last Week" (starts 7 days ago, ends today) or "Current Week"
        // Let's stick to strict calendar weeks for "Weekly Reports".
        // Start of THIS week (Monday)
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1));
        startOfWeek.setHours(0, 0, 0, 0);

        // Actually, usually you view the *previous* completed week.
        // Let's allow query param ?date=YYYY-MM-DD to specify start date.
        // Default to "Current Week So Far"

        const dateStr = startOfWeek.toISOString().split('T')[0];
        // @ts-ignore
        const report = await service.getWeeklyReport(req.user!.id, dateStr);
        return ApiResponse.success(res, report);
    }

    static async getByDate(req: Request, res: Response) {
        const { date } = req.params;
        // @ts-ignore
        const report = await service.getWeeklyReport(req.user!.id, date);
        return ApiResponse.success(res, report);
    }
}

import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { HTTP_STATUS } from '../utils/httpStatus';

interface ChildReport {
    childId: string;
    childName: string;
    totalMinutes: number;
    videosWatched: number;
    blockedAttempts: number;
    topCategories: { category: string; count: number }[];
    insights: { type: 'positive' | 'neutral' | 'alert'; message: string; icon: string }[];
}

export class ReportService {

    async getWeeklyReport(parentId: string, weekStartDate: string) {
        const existing = await prisma.weeklyReport.findFirst({
            where: { parentId, weekStartDate },
        });
        if (existing) return existing;
        return this.generateWeeklyReport(parentId, weekStartDate);
    }

    async generateWeeklyReport(parentId: string, weekStartStr: string) {
        const weekStart = new Date(weekStartStr);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const children = await prisma.child.findMany({
            where: { parentId, isActive: true },
        });

        if (!children.length) {
            throw new AppError('No active children found', HTTP_STATUS.NOT_FOUND);
        }

        const summary = {
            totalWatchTimeMinutes: 0,
            totalVideosWatched: 0,
            totalBlockedAttempts: 0,
            averageDailyTime: 0,
        };
        const childrenReports: ChildReport[] = [];

        for (const child of children) {
            const stats = await this.generateChildStats(child, weekStart, weekEnd);
            childrenReports.push(stats);
            summary.totalWatchTimeMinutes += stats.totalMinutes;
            summary.totalVideosWatched += stats.videosWatched;
            summary.totalBlockedAttempts += stats.blockedAttempts;
        }

        summary.averageDailyTime = Math.round(summary.totalWatchTimeMinutes / 7);

        try {
            const saved = await prisma.weeklyReport.create({
                data: {
                    parentId,
                    weekStartDate: weekStartStr,
                    weekEndDate: weekEnd.toISOString().split('T')[0],
                    summary,
                    childrenReports: childrenReports as unknown as import('@prisma/client').Prisma.InputJsonValue,
                },
            });
            return saved;
        } catch (err: unknown) {
            // Unique constraint — concurrent generation: fetch existing
            const existing = await prisma.weeklyReport.findFirst({ where: { parentId, weekStartDate: weekStartStr } });
            if (existing) return existing;
            throw new AppError('Failed to save report', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    private async generateChildStats(child: { id: string; name: string }, start: Date, end: Date): Promise<ChildReport> {
        const [history, blockedCount] = await Promise.all([
            prisma.watchHistory.findMany({
                where: { childId: child.id, watchedAt: { gte: start, lt: end } },
                select: { watchedDuration: true, category: true, completedWatch: true },
            }),
            prisma.activityLog.count({
                where: {
                    childId: child.id,
                    type: 'blocked_attempt',
                    timestamp: { gte: start, lt: end },
                },
            }),
        ]);

        const totalSeconds = history.reduce((acc, v) => acc + (v.watchedDuration ?? 0), 0);
        const totalMinutes = Math.round(totalSeconds / 60);

        const catMap: Record<string, number> = {};
        history.forEach(v => {
            const cat = v.category ?? 'Uncategorized';
            catMap[cat] = (catMap[cat] ?? 0) + 1;
        });
        const topCategories = Object.entries(catMap)
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        const insights = this.generateInsights(
            history.map(h => ({ category: h.category, completed_watch: h.completedWatch })),
            blockedCount,
        );

        return {
            childId: child.id,
            childName: child.name,
            totalMinutes,
            videosWatched: history.length,
            blockedAttempts: blockedCount,
            topCategories,
            insights,
        };
    }

    async generatePDF(report: any): Promise<Buffer> {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const PDFDocument = require('pdfkit');

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            const buffers: Buffer[] = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            doc.fontSize(24).fillColor('#1F2937').text('Weekly Activity Report', { align: 'center' });
            
            const startDateStr = report.weekStartDate instanceof Date 
                ? report.weekStartDate.toISOString().split('T')[0] 
                : report.weekStartDate;
            const endDateStr = report.weekEndDate instanceof Date 
                ? report.weekEndDate.toISOString().split('T')[0] 
                : report.weekEndDate;

            doc.fontSize(12).fillColor('#6B7280').text(`${startDateStr} - ${endDateStr}`, { align: 'center' });
            doc.moveDown(2);

            doc.fontSize(16).fillColor('#111827').text('Family Summary');
            doc.moveDown(0.5);
            doc.fontSize(12).fillColor('#374151');

            const s = report.summary;
            doc.text(`Total Watch Time: ${Math.round(s.totalWatchTimeMinutes / 60)}h ${s.totalWatchTimeMinutes % 60}m`);
            doc.text(`Videos Watched: ${s.totalVideosWatched}`);
            doc.text(`Blocked Attempts: ${s.totalBlockedAttempts}  |  Daily Avg: ${s.averageDailyTime}m`);
            doc.moveDown(2);

            doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#E5E7EB').stroke();
            doc.moveDown(2);

            const childrenArray = Array.isArray(report.childrenReports) ? report.childrenReports : [];
            childrenArray.forEach((child: any) => {
                if (doc.y > 700) doc.addPage();

                doc.fontSize(18).fillColor('#4F46E5').text(child.childName);
                doc.fontSize(10).fillColor('#6B7280').text(`${child.totalMinutes}m watched • ${child.videosWatched} videos`);
                doc.moveDown(1);

                doc.fontSize(12).fillColor('#111827').text('Top Interests:');
                doc.fontSize(10).fillColor('#374151');
                if (!child.topCategories.length) {
                    doc.text('No activity recorded', { indent: 20 });
                }
                child.topCategories.forEach((cat: any, i: number) => {
                    doc.text(`${i + 1}. ${cat.category} (${cat.count} videos)`, { indent: 20 });
                });
                doc.moveDown(1);

                if (child.insights.length > 0) {
                    doc.fontSize(12).fillColor('#111827').text('Insights:');
                    child.insights.forEach((insight: any) => {
                        let color = '#374151';
                        if (insight.type === 'positive') color = '#059669';
                        if (insight.type === 'alert') color = '#DC2626';
                        doc.fillColor(color).text(`• ${insight.message}`, { indent: 20 });
                    });
                }
                doc.moveDown(2);
            });

            doc.fontSize(10).fillColor('#9CA3AF').text('Generated by Safeguard • safeguard-kids.com', 50, 750, { align: 'center', width: 500 });
            doc.end();
        });
    }

    private generateInsights(
        history: { category: string | null; completed_watch: boolean | null }[],
        blockedCount: number,
    ) {
        const insights: { type: 'positive' | 'neutral' | 'alert'; message: string; icon: string }[] = [];

        const eduCount = history.filter(v =>
            v.category?.toLowerCase().includes('education') ||
            v.category?.toLowerCase().includes('science'),
        ).length;

        if (history.length > 0) {
            const eduPercent = (eduCount / history.length) * 100;
            if (eduPercent > 40) {
                insights.push({ type: 'positive', icon: '🎓', message: 'Great learning focus! A significant portion of watch time was educational.' });
            }
        }

        const completedCount = history.filter(v => v.completed_watch).length;
        if (history.length > 10) {
            const completeRate = (completedCount / history.length) * 100;
            if (completeRate < 30) {
                insights.push({ type: 'neutral', icon: '⏭️', message: 'Frequent skipping. Consider shorter videos or checking if content is engaging.' });
            }
        }

        if (blockedCount > 5) {
            insights.push({ type: 'alert', icon: '⚠️', message: `${blockedCount} attempts to access blocked content. You may want to review filters.` });
        }

        return insights;
    }
}

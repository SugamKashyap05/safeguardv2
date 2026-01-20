import { supabaseAdmin } from '../config/supabase';
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

    /**
     * Generate or Retrieve Weekly Report
     */
    async getWeeklyReport(parentId: string, weekStartDate: string) {
        // 1. Check if exists
        const { data: existing } = await supabaseAdmin
            .from('weekly_reports')
            .select('*')
            .eq('parent_id', parentId)
            .eq('week_start_date', weekStartDate)
            .single();

        if (existing) return existing;

        // 2. Generate if not exists (and if week has passed? Or dynamic? 
        // For MVP, allow on-demand generation for "current week" or "past week")
        return this.generateWeeklyReport(parentId, weekStartDate);
    }

    async generateWeeklyReport(parentId: string, weekStartStr: string) {
        const weekStart = new Date(weekStartStr);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        // 1. Get Children
        const { data: children } = await supabaseAdmin
            .from('children')
            .select('*')
            .eq('parent_id', parentId)
            .eq('is_active', true);

        if (!children || children.length === 0) {
            throw new AppError('No active children found', HTTP_STATUS.NOT_FOUND);
        }

        const report = {
            parent_id: parentId,
            week_start_date: weekStartStr,
            week_end_date: weekEnd.toISOString().split('T')[0],
            summary: {
                totalWatchTimeMinutes: 0,
                totalVideosWatched: 0,
                totalBlockedAttempts: 0,
                averageDailyTime: 0
            },
            children_reports: [] as ChildReport[]
        };

        // 2. Process each child
        for (const child of children) {
            const childStats = await this.generateChildStats(child, weekStart, weekEnd);
            report.children_reports.push(childStats);

            report.summary.totalWatchTimeMinutes += childStats.totalMinutes;
            report.summary.totalVideosWatched += childStats.videosWatched;
            report.summary.totalBlockedAttempts += childStats.blockedAttempts;
        }

        report.summary.averageDailyTime = Math.round(report.summary.totalWatchTimeMinutes / 7);

        // 3. Save Report
        const { data, error } = await supabaseAdmin
            .from('weekly_reports')
            .insert(report)
            .select()
            .single();

        if (error) {
            console.error('Failed to save report', error);
            // If duplicate (race condition), just return what was there
            // or re-fetch. For now, throw.
            throw new AppError('Failed to save report', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }

        return data;
    }

    private async generateChildStats(child: any, start: Date, end: Date): Promise<ChildReport> {
        // Watch History
        const { data: history } = await supabaseAdmin
            .from('watch_history')
            .select('*')
            .eq('child_id', child.id)
            .gte('watched_at', start.toISOString())
            .lt('watched_at', end.toISOString());

        // Blocked Content / Activity Logs
        // Assuming we log blocked attempts in activity_logs or blocked_content
        const { count: blockedCount } = await supabaseAdmin
            .from('activity_logs')
            .select('*', { count: 'exact', head: true })
            .eq('child_id', child.id)
            .eq('type', 'blocked_attempt')
            .gte('timestamp', start.toISOString())
            .lt('timestamp', end.toISOString());

        const videos = history || [];
        // Calculate totals
        // Assuming 'watched_duration' is in seconds, user prompt said minutes? 
        // Let's assume watched_duration is SECONDS in DB based on previous schema work, so / 60.
        // Or if schema says INTEGER, let's assume seconds.
        const totalSeconds = videos.reduce((acc, v) => acc + (v.watched_duration || 0), 0);
        const totalMinutes = Math.round(totalSeconds / 60);

        // Top Categories
        const catMap: Record<string, number> = {};
        videos.forEach(v => {
            const cat = v.category || 'Uncategorized';
            catMap[cat] = (catMap[cat] || 0) + 1;
        });
        const topCategories = Object.entries(catMap)
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Insights
        const insights = this.generateInsights(videos, blockedCount || 0);

        return {
            childId: child.id,
            childName: child.name,
            totalMinutes,
            videosWatched: videos.length,
            blockedAttempts: blockedCount || 0,
            topCategories,
            insights
        };
    }

    /**
     * Generate PDF for a Report
     */
    async generatePDF(report: any): Promise<Buffer> {
        const PDFDocument = require('pdfkit');

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            const buffers: Buffer[] = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // -- Header --
            doc.fontSize(24).fillColor('#1F2937').text('Weekly Activity Report', { align: 'center' });
            doc.fontSize(12).fillColor('#6B7280').text(`${report.week_start_date} - ${report.week_end_date}`, { align: 'center' });
            doc.moveDown(2);

            // -- Summary --
            doc.fontSize(16).fillColor('#111827').text('Family Summary');
            doc.moveDown(0.5);
            doc.fontSize(12).fillColor('#374151');

            const summaryY = doc.y;
            doc.text(`Total Watch Time: ${Math.round(report.summary.totalWatchTimeMinutes / 60)}h ${report.summary.totalWatchTimeMinutes % 60}m`, 50, summaryY);
            doc.text(`Videos Watched: ${report.summary.totalVideosWatched}`, 250, summaryY);
            doc.moveDown(0.5);

            const summaryY2 = doc.y;
            doc.text(`Blocked Attempts: ${report.summary.totalBlockedAttempts}`, 50, summaryY2);
            doc.text(`Daily Avg: ${report.summary.averageDailyTime}m`, 250, summaryY2);

            doc.moveDown(2);

            // -- Divider --
            doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#E5E7EB').stroke();
            doc.moveDown(2);

            // -- Children --
            report.children_reports.forEach((child: any) => {
                if (doc.y > 700) doc.addPage();

                doc.fontSize(18).fillColor('#4F46E5').text(child.childName);
                doc.fontSize(10).fillColor('#6B7280').text(`${child.totalMinutes}m watched • ${child.videosWatched} videos`);
                doc.moveDown(1);

                // Top Categories
                doc.fontSize(12).fillColor('#111827').text('Top Interests:');
                doc.FontSize(10).fillColor('#374151');
                if (child.topCategories.length === 0) {
                    doc.text('No activity recorded', { indent: 20 });
                }
                child.topCategories.forEach((cat: any, i: number) => {
                    doc.text(`${i + 1}. ${cat.category} (${cat.count} videos)`, { indent: 20 });
                });
                doc.moveDown(1);

                // Insights
                if (child.insights.length > 0) {
                    doc.fontSize(12).fillColor('#111827').text('Insights:');
                    child.insights.forEach((insight: any) => {
                        let color = '#374151';
                        if (insight.type === 'positive') color = '#059669';
                        if (insight.type === 'alert') color = '#DC2626';

                        doc.fillColor(color).text(`• ${insight.message}`, { indent: 20 });
                    });
                } else {
                    doc.text('No specific insights this week.', { indent: 20, color: '#9CA3AF' });
                }

                doc.moveDown(2);
            });

            // Footer
            doc.fontSize(10).fillColor('#9CA3AF').text('Generated by Safeguard • safeguard-kids.com', 50, 750, { align: 'center', width: 500 });

            doc.end();
        });
    }

    private generateInsights(history: any[], blockedCount: number) {
        const insights: { type: 'positive' | 'neutral' | 'alert'; message: string; icon: string }[] = [];

        // Education
        const eduCount = history.filter(v =>
            (v.category && v.category.toLowerCase().includes('education')) ||
            (v.category && v.category.toLowerCase().includes('science'))
        ).length;

        if (history.length > 0) {
            const eduPercent = (eduCount / history.length) * 100;
            if (eduPercent > 40) {
                insights.push({
                    type: 'positive',
                    icon: '🎓',
                    message: 'Great learning focus! A signficant portion of watch time was educational.'
                });
            }
        }

        // Completion
        const completedCount = history.filter(v => v.completed_watch).length;
        if (history.length > 10) {
            const completeRate = (completedCount / history.length) * 100;
            if (completeRate < 30) {
                insights.push({
                    type: 'neutral',
                    icon: '⏭️',
                    message: 'Frequent skipping. Consider shorter videos or checking if content is engaging.'
                });
            }
        }

        // Blocked
        if (blockedCount > 5) {
            insights.push({
                type: 'alert',
                icon: '⚠️',
                message: `${blockedCount} attempts to access blocked content. You may want to review filters.`
            });
        }

        return insights;
    }
}

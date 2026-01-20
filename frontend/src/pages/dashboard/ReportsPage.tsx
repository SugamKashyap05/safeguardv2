
// I'll add a link/button to the Parent Dashboard first to access reports
// Actually, I should just create the page content first.
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Download, Share2, TrendingUp, AlertTriangle, Clock, Video } from 'lucide-react';

const ReportsPage = () => {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReport();
    }, []);

    const loadReport = async () => {
        try {
            const res = await api.get('/reports/latest');
            setReport(res.data.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Generating insights...</div>;
    if (!report) return <div className="p-8 text-center text-gray-500">No report available for this week yet.</div>;

    const { summary, children_reports, week_start_date, week_end_date } = report;

    return (
        <div className="max-w-7xl mx-auto p-8 space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Weekly Activity Report</h1>
                    <p className="text-gray-500 mt-1">
                        {new Date(week_start_date).toLocaleDateString()} - {new Date(week_end_date).toLocaleDateString()}
                    </p>
                </div>
                <div className="flex space-x-3">
                    <button className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors">
                        <Share2 size={18} />
                        <span>Share</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm">
                        <Download size={18} />
                        <span>Download PDF</span>
                    </button>
                </div>
            </div>

            {/* Family Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <SummaryCard
                    icon={<Clock className="text-blue-500" />}
                    title="Total Watch Time"
                    value={`${Math.round(summary.totalWatchTimeMinutes / 60)}h ${summary.totalWatchTimeMinutes % 60}m`}
                    subtext="Across all children"
                />
                <SummaryCard
                    icon={<Video className="text-purple-500" />}
                    title="Videos Watched"
                    value={summary.totalVideosWatched}
                    subtext="Total plays"
                />
                <SummaryCard
                    icon={<AlertTriangle className="text-yellow-500" />}
                    title="Blocked Attempts"
                    value={summary.totalBlockedAttempts}
                    subtext="Content filtered"
                />
                <SummaryCard
                    icon={<TrendingUp className="text-green-500" />}
                    title="Daily Average"
                    value={`${summary.averageDailyTime}m`}
                    subtext="Per active day"
                />
            </div>

            {/* Children Reports */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800">Child Insights</h2>
                {children_reports.map((child: any) => (
                    <ChildReportCard key={child.childId} data={child} />
                ))}
            </div>
        </div>
    );
};

const SummaryCard = ({ icon, title, value, subtext }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
        <div className="p-3 bg-gray-50 rounded-full mb-3">{icon}</div>
        <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
        <div className="text-sm font-medium text-gray-600 mb-1">{title}</div>
        <div className="text-xs text-gray-400">{subtext}</div>
    </div>
);

const ChildReportCard = ({ data }: any) => {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                        👶
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{data.childName}</h3>
                        <p className="text-sm text-gray-500">{data.totalMinutes}m watched • {data.videosWatched} videos</p>
                    </div>
                </div>
                {/* Insights Badges */}
                <div className="flex -space-x-2">
                    {/* Could show avatars of top channels here */}
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Insights List */}
                <div>
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Weekly Highlights</h4>
                    <div className="space-y-3">
                        {data.insights.length === 0 && <p className="text-gray-400 italic">No specific highlights this week.</p>}
                        {data.insights.map((insight: any, i: number) => (
                            <div key={i} className={`flex items-start space-x-3 p-3 rounded-xl ${insight.type === 'positive' ? 'bg-green-50 text-green-800' :
                                insight.type === 'alert' ? 'bg-red-50 text-red-800' :
                                    'bg-blue-50 text-blue-800'
                                }`}>
                                <span className="text-xl">{insight.icon}</span>
                                <span className="text-sm font-medium">{insight.message}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Categories Chart (Simple CSS Bar) */}
                <div>
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Top Interests</h4>
                    <div className="space-y-3">
                        {data.topCategories.map((cat: any) => (
                            <div key={cat.category}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-gray-700 capitalize">{cat.category}</span>
                                    <span className="text-gray-500">{cat.count} videos</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div
                                        className="bg-blue-500 h-2 rounded-full"
                                        style={{ width: `${Math.min((cat.count / data.videosWatched) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                        {data.topCategories.length === 0 && <p className="text-gray-400 italic">No data yet.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;

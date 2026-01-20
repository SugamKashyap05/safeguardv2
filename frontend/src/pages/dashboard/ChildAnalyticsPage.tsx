import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { ArrowLeft, Clock, Video, BookOpen, CheckCircle, Loader2, BarChart3, TrendingUp } from 'lucide-react';
import { StatCard } from '../../components/analytics/StatCard';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
    BarChart, Bar
} from 'recharts';

interface Analytics {
    overview: {
        totalWatchTime: number;
        videosWatched: number;
        avgSessionLength: number;
        completionRate: number;
        educationalPercent: number;
    };
    trends: {
        dailyUsage: { date: string; minutes: number; limit: number }[];
        peakHours: { hour: number; minutes: number }[];
        dayOfWeekPattern: { day: string; minutes: number }[];
    };
    content: {
        topCategories: { name: string; value: number; color: string }[];
        topChannels: { id: string; name: string; thumbnail: string; watchTime: number }[];
        topVideos: { id: string; title: string; thumbnail: string; views: number }[];
    };
    safety: {
        blockedAttempts: number;
        approvalRequests: number;
        limitHits: number;
    };
    insights: {
        type: 'positive' | 'attention' | 'info';
        icon: string;
        title: string;
        message: string;
        actionText?: string;
        actionUrl?: string;
    }[];
}

const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
};

export const ChildAnalyticsPage = () => {
    const { childId } = useParams();
    const navigate = useNavigate();
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [childName, setChildName] = useState('');
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState(30);

    useEffect(() => {
        fetchAnalytics();
        fetchChildInfo();
    }, [childId, range]);

    const fetchAnalytics = async () => {
        try {
            const res = await api.get(`/analytics/child/${childId}?range=${range}`);
            setAnalytics(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchChildInfo = async () => {
        try {
            const res = await api.get(`/children/${childId}`);
            setChildName(res.data.data.name);
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
            </div>
        );
    }

    if (!analytics) {
        return <div className="p-8 text-center text-gray-500">No analytics data available</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{childName}'s Analytics</h1>
                            <p className="text-sm text-gray-500">Last {range} days</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {[7, 30, 90].map(r => (
                            <button
                                key={r}
                                onClick={() => setRange(r)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${range === r ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {r}d
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 space-y-6">
                {/* Overview Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Watch Time"
                        value={formatTime(analytics.overview.totalWatchTime)}
                        icon={<Clock size={20} />}
                    />
                    <StatCard
                        title="Videos Watched"
                        value={analytics.overview.videosWatched}
                        icon={<Video size={20} />}
                    />
                    <StatCard
                        title="Educational Content"
                        value={`${analytics.overview.educationalPercent}%`}
                        icon={<BookOpen size={20} />}
                        positive={analytics.overview.educationalPercent >= 50}
                    />
                    <StatCard
                        title="Completion Rate"
                        value={`${analytics.overview.completionRate}%`}
                        icon={<CheckCircle size={20} />}
                    />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Daily Usage Chart */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <TrendingUp size={20} className="text-indigo-600" />
                            Daily Watch Time
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={analytics.trends.dailyUsage.slice(-14)}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(d) => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                                    tick={{ fontSize: 11 }}
                                />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip
                                    formatter={(value) => [`${value} min`, 'Watch Time']}
                                    labelFormatter={(d) => new Date(d).toLocaleDateString()}
                                />
                                <Line type="monotone" dataKey="minutes" stroke="#4F46E5" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="limit" stroke="#F59E0B" strokeDasharray="5 5" strokeWidth={1} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Category Breakdown */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <BarChart3 size={20} className="text-indigo-600" />
                            Content Categories
                        </h3>
                        {analytics.content.topCategories.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={analytics.content.topCategories}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                                        labelLine={false}
                                    >
                                        {analytics.content.topCategories.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[250px] flex items-center justify-center text-gray-400">
                                No category data
                            </div>
                        )}
                    </div>
                </div>

                {/* Peak Hours & Day Pattern */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Peak Hours */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Peak Viewing Hours</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={analytics.trends.peakHours}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="hour"
                                    tickFormatter={(h) => `${h}:00`}
                                    tick={{ fontSize: 10 }}
                                />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip formatter={(v) => [`${v} min`, 'Watch Time']} />
                                <Bar dataKey="minutes" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Day of Week */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Weekly Pattern</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={analytics.trends.dayOfWeekPattern}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(v) => [`${v} min`, 'Watch Time']} />
                                <Bar dataKey="minutes" fill="#10B981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Insights & Top Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Insights */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">💡 Insights</h3>
                        <div className="space-y-3">
                            {analytics.insights.length > 0 ? analytics.insights.map((insight, idx) => (
                                <div
                                    key={idx}
                                    className={`p-3 rounded-xl ${insight.type === 'positive' ? 'bg-green-50 border border-green-100' :
                                        insight.type === 'attention' ? 'bg-amber-50 border border-amber-100' :
                                            'bg-blue-50 border border-blue-100'
                                        }`}
                                >
                                    <div className="flex items-start gap-2">
                                        <span className="text-xl">{insight.icon}</span>
                                        <div>
                                            <p className="font-bold text-sm text-gray-800">{insight.title}</p>
                                            <p className="text-xs text-gray-600">{insight.message}</p>
                                            {insight.actionText && (
                                                <button
                                                    onClick={() => navigate(insight.actionUrl || '#')}
                                                    className="text-xs font-bold text-indigo-600 mt-1 hover:underline"
                                                >
                                                    {insight.actionText} →
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-gray-400 text-sm">No insights available yet</p>
                            )}
                        </div>
                    </div>

                    {/* Top Channels */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">📺 Top Channels</h3>
                        <ul className="space-y-3">
                            {analytics.content.topChannels.length > 0 ? analytics.content.topChannels.map((channel, idx) => (
                                <li key={channel.id} className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-gray-400 w-4">{idx + 1}</span>
                                    <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden">
                                        {channel.thumbnail ? (
                                            <img src={channel.thumbnail} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">?</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 truncate">{channel.name}</p>
                                    </div>
                                    <span className="text-xs text-gray-500">{channel.watchTime}m</span>
                                </li>
                            )) : (
                                <p className="text-gray-400 text-sm">No data</p>
                            )}
                        </ul>
                    </div>

                    {/* Top Videos */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">🎬 Most Watched</h3>
                        <ul className="space-y-3">
                            {analytics.content.topVideos.length > 0 ? analytics.content.topVideos.map((video, idx) => (
                                <li key={video.id} className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-gray-400 w-4">{idx + 1}</span>
                                    <div className="w-12 h-7 rounded bg-gray-100 overflow-hidden shrink-0">
                                        {video.thumbnail ? (
                                            <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-xs">?</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-800 line-clamp-2">{video.title}</p>
                                    </div>
                                    <span className="text-xs text-gray-500">{video.views}x</span>
                                </li>
                            )) : (
                                <p className="text-gray-400 text-sm">No data</p>
                            )}
                        </ul>
                    </div>
                </div>

                {/* Safety Stats */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
                    <h3 className="text-lg font-bold mb-4">🛡️ Safety Overview</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-3xl font-bold">{analytics.safety.blockedAttempts}</p>
                            <p className="text-sm opacity-80">Blocked Attempts</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold">{analytics.safety.approvalRequests}</p>
                            <p className="text-sm opacity-80">Approval Requests</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold">{analytics.safety.limitHits}</p>
                            <p className="text-sm opacity-80">Limit Reached Days</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

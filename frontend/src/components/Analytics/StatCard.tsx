import { TrendingUp, TrendingDown } from 'lucide-react';
import { ReactNode } from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    trend?: number;
    icon: ReactNode;
    subtitle?: string;
    positive?: boolean;
}

export const StatCard = ({ title, value, trend, icon, subtitle, positive }: StatCardProps) => {
    const hasTrend = trend !== undefined && trend !== 0;
    const isPositiveTrend = trend && trend > 0;

    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${positive !== false ? 'bg-indigo-50' : 'bg-amber-50'}`}>
                    <div className={positive !== false ? 'text-indigo-600' : 'text-amber-600'}>
                        {icon}
                    </div>
                </div>
                {hasTrend && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${isPositiveTrend ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                        }`}>
                        {isPositiveTrend ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>

            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && (
                <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
            )}
        </div>
    );
};

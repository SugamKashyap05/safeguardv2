import React from 'react';

type SafetyLevel = 'safe' | 'warning' | 'blocked' | 'unknown' | 'educational';

interface SafetyBadgeProps {
    level: SafetyLevel;
    label?: string;
    className?: string;
    size?: 'sm' | 'md';
}

export const SafetyBadge: React.FC<SafetyBadgeProps> = ({
    level,
    label,
    className = '',
    size = 'md'
}) => {
    const styles = {
        safe: 'bg-green-100 text-green-700 border-green-200',
        warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        blocked: 'bg-red-100 text-red-700 border-red-200',
        unknown: 'bg-gray-100 text-gray-700 border-gray-200',
        educational: 'bg-blue-100 text-blue-700 border-blue-200',
    };

    const icons = {
        safe: '🛡️',
        warning: '⚠️',
        blocked: '🚫',
        unknown: '❓',
        educational: '🎓',
    };

    const defaultLabels = {
        safe: 'Safe',
        warning: 'Warning',
        blocked: 'Blocked',
        unknown: 'Unknown',
        educational: 'Educational',
    };

    const py = size === 'sm' ? 'py-0.5' : 'py-1';
    const px = size === 'sm' ? 'px-2' : 'px-3';
    const text = size === 'sm' ? 'text-xs' : 'text-sm';

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${styles[level]} ${py} ${px} ${text} ${className}`}>
            <span>{icons[level]}</span>
            <span>{label || defaultLabels[level]}</span>
        </span>
    );
};

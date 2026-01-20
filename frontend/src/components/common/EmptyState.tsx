import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
    imageSrc?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon,
    title,
    description,
    action,
    className,
    imageSrc
}) => {
    return (
        <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
            {imageSrc ? (
                <img src={imageSrc} alt="" className="w-48 h-48 mb-6 object-contain opacity-80" />
            ) : Icon ? (
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
                    <Icon size={32} />
                </div>
            ) : null}

            <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>

            {description && (
                <p className="text-gray-500 max-w-sm mb-6">{description}</p>
            )}

            {action}
        </div>
    );
};

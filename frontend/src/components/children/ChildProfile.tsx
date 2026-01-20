import React from 'react';
import clsx from 'clsx';

interface ChildProfileProps {
    child: {
        name: string;
        avatar?: string;
        age?: number;
    };
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showDetails?: boolean;
    className?: string;
}

export const ChildProfile: React.FC<ChildProfileProps> = ({
    child,
    size = 'md',
    showDetails = true,
    className
}) => {
    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-16 h-16 text-xl',
        xl: 'w-24 h-24 text-3xl'
    };

    return (
        <div className={clsx('flex items-center gap-3', className)}>
            <div className={clsx(
                'rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-sm',
                sizeClasses[size]
            )}>
                {child.avatar || child.name?.charAt(0)}
            </div>
            {showDetails && (
                <div>
                    <h3 className={clsx('font-bold text-gray-900', size === 'xl' ? 'text-2xl' : 'text-base')}>
                        {child.name}
                    </h3>
                    {child.age && (
                        <p className="text-sm text-gray-500">Age {child.age}</p>
                    )}
                </div>
            )}
        </div>
    );
};

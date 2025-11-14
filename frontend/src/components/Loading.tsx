'use client';

import { themeColors } from '@/utils/colors';

interface LoadingProps {
  type?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export default function Loading({
  type = 'spinner',
  size = 'md',
  text,
  className = '',
}: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  if (type === 'skeleton') {
    return (
      <div className={`loading-shimmer rounded ${className}`} />
    );
  }

  if (type === 'dots') {
    return (
      <div className={`flex items-center justify-center space-x-1 ${className}`}>
        <div 
          className="w-2 h-2 rounded-full animate-bounce"
          style={{ backgroundColor: themeColors.primary }}
        />
        <div 
          className="w-2 h-2 rounded-full animate-bounce"
          style={{ 
            backgroundColor: themeColors.primary,
            animationDelay: '0.1s'
          }}
        />
        <div 
          className="w-2 h-2 rounded-full animate-bounce"
          style={{ 
            backgroundColor: themeColors.primary,
            animationDelay: '0.2s'
          }}
        />
        {text && <span className="ml-2 text-sm text-gray-600">{text}</span>}
      </div>
    );
  }

  if (type === 'pulse') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div 
          className={`${sizeClasses[size]} rounded-full animate-pulse-slow`}
          style={{ backgroundColor: themeColors.primary }}
        />
        {text && <span className="ml-2 text-sm text-gray-600">{text}</span>}
      </div>
    );
  }

  // Default spinner
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div 
        className={`${sizeClasses[size]} border-2 border-gray-200 rounded-full animate-spin`}
        style={{ borderTopColor: themeColors.primary }}
      />
      {text && <span className="ml-2 text-sm text-gray-600">{text}</span>}
    </div>
  );
}
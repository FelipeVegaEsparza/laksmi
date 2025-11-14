'use client';

import { ReactNode } from 'react';
import { themeColors } from '@/utils/colors';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  gradient?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export default function Card({
  children,
  className = '',
  hover = false,
  padding = 'md',
  shadow = 'md',
  rounded = 'lg',
  gradient = false,
  onClick,
  style,
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  };

  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
  };

  const baseClasses = `
    bg-white 
    ${paddingClasses[padding]} 
    ${shadowClasses[shadow]} 
    ${roundedClasses[rounded]}
    ${hover ? 'hover-lift transition-all duration-300' : ''}
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const cardStyle = gradient ? {
    background: `linear-gradient(135deg, white 0%, ${themeColors.primaryLight} 100%)`,
    border: `1px solid ${themeColors.primary}20`,
    ...style,
  } : style || {};

  return (
    <div 
      className={baseClasses}
      style={cardStyle}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
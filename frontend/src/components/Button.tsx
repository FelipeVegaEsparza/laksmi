'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';
import { themeColors } from '@/utils/colors';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  href?: string;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  href,
  ...props
}: ButtonProps) {
  const baseStyles = 'font-medium rounded-lg transition-all duration-200 inline-flex items-center justify-center';
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  const getVariantStyles = () => {
    if (disabled) {
      return {
        className: 'bg-gray-300 text-gray-500 cursor-not-allowed',
        style: {},
      };
    }
    
    switch (variant) {
      case 'primary':
        return {
          className: 'text-white shadow-sm hover:shadow-md',
          style: {
            backgroundColor: themeColors.primary,
          },
          onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
            if (!disabled) {
              e.currentTarget.style.backgroundColor = themeColors.primaryHover;
            }
          },
          onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
            if (!disabled) {
              e.currentTarget.style.backgroundColor = themeColors.primary;
            }
          },
        };
      case 'secondary':
        return {
          className: 'text-white shadow-sm hover:shadow-md',
          style: {
            backgroundColor: themeColors.secondary,
          },
          onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
            if (!disabled) {
              e.currentTarget.style.backgroundColor = themeColors.secondaryHover;
            }
          },
          onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
            if (!disabled) {
              e.currentTarget.style.backgroundColor = themeColors.secondary;
            }
          },
        };
      case 'outline':
        return {
          className: 'bg-white border-2 hover:text-white',
          style: {
            borderColor: themeColors.primary,
            color: themeColors.primary,
          },
          onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
            if (!disabled) {
              e.currentTarget.style.backgroundColor = themeColors.primary;
              e.currentTarget.style.color = 'white';
            }
          },
          onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
            if (!disabled) {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.color = themeColors.primary;
            }
          },
        };
      case 'ghost':
        return {
          className: 'bg-transparent hover:bg-opacity-10',
          style: {
            color: themeColors.primary,
          },
          onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
            if (!disabled) {
              e.currentTarget.style.backgroundColor = themeColors.primaryLight;
            }
          },
          onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
            if (!disabled) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          },
        };
      default:
        return { className: '', style: {} };
    }
  };
  
  const variantStyles = getVariantStyles();
  const widthClass = fullWidth ? 'w-full' : '';
  const combinedClassName = `${baseStyles} ${sizeStyles[size]} ${variantStyles.className} ${widthClass} ${className}`;
  
  // Si hay href, renderizar como Link
  if (href) {
    return (
      <Link
        href={href}
        className={combinedClassName}
        style={variantStyles.style}
        onMouseEnter={variantStyles.onMouseEnter}
        onMouseLeave={variantStyles.onMouseLeave}
      >
        {children}
      </Link>
    );
  }
  
  // Si no hay href, renderizar como button
  return (
    <button
      className={combinedClassName}
      style={variantStyles.style}
      onMouseEnter={variantStyles.onMouseEnter}
      onMouseLeave={variantStyles.onMouseLeave}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

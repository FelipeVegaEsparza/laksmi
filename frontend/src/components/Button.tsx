'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'
import Link from 'next/link'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  href?: string
  fullWidth?: boolean
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  fullWidth = false,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const sizeStyles = {
    sm: 'px-4 py-1.5 text-sm',
    md: 'px-6 py-2 text-base',
    lg: 'px-8 py-3 text-lg',
  }
  
  const variantStyles = {
    primary: {
      style: {
        backgroundColor: 'var(--color-primary)',
        color: 'white',
      }
    },
    secondary: {
      style: {
        backgroundColor: 'var(--color-secondary)',
        color: 'white',
      }
    },
    outline: {
      style: {
        backgroundColor: 'transparent',
        color: 'var(--color-primary)',
        border: '2px solid var(--color-primary)',
      }
    },
  }
  
  const classes = `${baseStyles} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`
  
  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        style={variantStyles[variant].style}
      >
        {children}
      </Link>
    )
  }
  
  return (
    <button
      className={classes}
      style={variantStyles[variant].style}
      {...props}
    >
      {children}
    </button>
  )
}

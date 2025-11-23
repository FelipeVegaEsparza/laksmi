'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface ThemeColors {
  primary: string
  secondary: string
  background: string
  text: string
}

interface ThemeContextType {
  colors: ThemeColors
  refreshTheme: () => Promise<void>
  isLoaded: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: ReactNode
}

const defaultColors: ThemeColors = {
  primary: '#e11d48',
  secondary: '#9333ea',
  background: '#ffffff',
  text: '#000000',
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [colors, setColors] = useState<ThemeColors>(defaultColors)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    loadTheme()
  }, [])

  useEffect(() => {
    // Apply colors to CSS variables
    if (typeof document !== 'undefined') {
      console.log('🎨 Frontend - Setting CSS variables:', colors)
      document.documentElement.style.setProperty('--color-primary', colors.primary)
      document.documentElement.style.setProperty('--color-secondary', colors.secondary)
      document.documentElement.style.setProperty('--color-background', colors.background)
      document.documentElement.style.setProperty('--color-text', colors.text)
      
      // Generate hover and light variants
      const primaryHover = adjustColor(colors.primary, -20) // Darker
      const primaryLight = adjustColor(colors.primary, 80) // Lighter
      const secondaryHover = adjustColor(colors.secondary, -20)
      const secondaryLight = adjustColor(colors.secondary, 80)
      
      document.documentElement.style.setProperty('--color-primary-hover', primaryHover)
      document.documentElement.style.setProperty('--color-primary-light', primaryLight)
      document.documentElement.style.setProperty('--color-secondary-hover', secondaryHover)
      document.documentElement.style.setProperty('--color-secondary-light', secondaryLight)
      
      // Verify they were set
      const computedPrimary = getComputedStyle(document.documentElement).getPropertyValue('--color-primary')
      console.log('✅ Frontend - CSS variable --color-primary set to:', computedPrimary)
    }
  }, [colors])

  // Helper function to adjust color brightness
  const adjustColor = (color: string, amount: number): string => {
    const hex = color.replace('#', '')
    const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount))
    const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount))
    const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount))
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  const loadTheme = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'
      console.log('🎨 Frontend - Loading theme from:', apiUrl)
      const response = await fetch(`${apiUrl}/company-settings`)
      const data = await response.json()
      console.log('🎨 Frontend - Theme data received:', data)
      
      if (data.success && data.data) {
        const newColors = {
          primary: data.data.frontendPrimaryColor || defaultColors.primary,
          secondary: data.data.frontendSecondaryColor || defaultColors.secondary,
          background: data.data.frontendBackgroundColor || defaultColors.background,
          text: data.data.frontendTextColor || defaultColors.text,
        }
        console.log('🎨 Frontend - Applying colors:', newColors)
        setColors(newColors)
        setIsLoaded(true)
      }
    } catch (error) {
      console.error('❌ Frontend - Error loading theme:', error)
      setIsLoaded(true) // Marcar como cargado incluso si falla
    }
  }

  const refreshTheme = async () => {
    await loadTheme()
  }

  return (
    <ThemeContext.Provider value={{ colors, refreshTheme, isLoaded }}>
      {children}
    </ThemeContext.Provider>
  )
}

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
      
      // Verify they were set
      const computedPrimary = getComputedStyle(document.documentElement).getPropertyValue('--color-primary')
      console.log('✅ Frontend - CSS variable --color-primary set to:', computedPrimary)
    }
  }, [colors])

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
      }
    } catch (error) {
      console.error('❌ Frontend - Error loading theme:', error)
    }
  }

  const refreshTheme = async () => {
    await loadTheme()
  }

  return (
    <ThemeContext.Provider value={{ colors, refreshTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useCompanySettings } from '@/hooks/useCompanySettings'
import { useEffect, useState } from 'react'

export default function TestColorsPage() {
  const { colors, refreshTheme } = useTheme()
  const { companyName, logoUrl } = useCompanySettings()
  const [cssVars, setCssVars] = useState<Record<string, string>>({})

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      setCssVars({
        '--color-primary': getComputedStyle(root).getPropertyValue('--color-primary'),
        '--color-secondary': getComputedStyle(root).getPropertyValue('--color-secondary'),
        '--color-background': getComputedStyle(root).getPropertyValue('--color-background'),
        '--color-text': getComputedStyle(root).getPropertyValue('--color-text'),
      })
    }
  }, [colors])

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold mb-8">Test de Colores Dinámicos</h1>

        {/* Company Info */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">Información de la Empresa</h2>
          <p><strong>Nombre:</strong> {companyName}</p>
          <p><strong>Logo URL:</strong> {logoUrl || 'No configurado'}</p>
          {logoUrl && (
            <img src={logoUrl} alt={companyName} className="mt-4 h-20" />
          )}
        </div>

        {/* Colors from Context */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">Colores desde Context</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold">Primary:</p>
              <div 
                className="h-20 rounded border-2 border-gray-300"
                style={{ backgroundColor: colors.primary }}
              />
              <p className="text-sm mt-1">{colors.primary}</p>
            </div>
            <div>
              <p className="font-semibold">Secondary:</p>
              <div 
                className="h-20 rounded border-2 border-gray-300"
                style={{ backgroundColor: colors.secondary }}
              />
              <p className="text-sm mt-1">{colors.secondary}</p>
            </div>
            <div>
              <p className="font-semibold">Background:</p>
              <div 
                className="h-20 rounded border-2 border-gray-300"
                style={{ backgroundColor: colors.background }}
              />
              <p className="text-sm mt-1">{colors.background}</p>
            </div>
            <div>
              <p className="font-semibold">Text:</p>
              <div 
                className="h-20 rounded border-2 border-gray-300 flex items-center justify-center"
                style={{ backgroundColor: '#f0f0f0', color: colors.text }}
              >
                <span className="text-2xl font-bold">Texto</span>
              </div>
              <p className="text-sm mt-1">{colors.text}</p>
            </div>
          </div>
        </div>

        {/* CSS Variables */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">Variables CSS</h2>
          <div className="space-y-2">
            {Object.entries(cssVars).map(([key, value]) => (
              <div key={key} className="flex items-center gap-4">
                <code className="bg-gray-100 px-2 py-1 rounded">{key}</code>
                <span>=</span>
                <span className="font-mono">{value || '(no definida)'}</span>
                {value && (
                  <div 
                    className="w-8 h-8 rounded border-2 border-gray-300"
                    style={{ backgroundColor: value }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Test Elements */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">Elementos de Prueba</h2>
          <div className="space-y-4">
            <button
              className="px-6 py-3 rounded-full text-white font-semibold"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Botón Primario (CSS Variable)
            </button>
            
            <button
              className="px-6 py-3 rounded-full text-white font-semibold"
              style={{ backgroundColor: colors.primary }}
            >
              Botón Primario (Context)
            </button>

            <div 
              className="p-4 rounded"
              style={{ 
                backgroundColor: 'var(--color-primary)',
                color: 'white'
              }}
            >
              Caja con color primario desde CSS variable
            </div>

            <div 
              className="p-4 rounded"
              style={{ 
                backgroundColor: colors.secondary,
                color: 'white'
              }}
            >
              Caja con color secundario desde Context
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="bg-white p-6 rounded-lg shadow">
          <button
            onClick={refreshTheme}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            🔄 Refrescar Tema
          </button>
        </div>
      </div>
    </div>
  )
}

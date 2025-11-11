import { useState, useEffect } from 'react'
import { apiService } from '@/services/apiService'

interface CompanySettings {
  id: string
  companyName: string
  companyDescription?: string
  logoUrl?: string
  facebookUrl?: string
  instagramUrl?: string
  tiktokUrl?: string
  xUrl?: string
  dashboardPrimaryColor: string
  dashboardSecondaryColor: string
  dashboardBackgroundColor: string
  dashboardTextColor: string
  frontendPrimaryColor: string
  frontendSecondaryColor: string
  frontendBackgroundColor: string
  frontendTextColor: string
}

export function useCompanySettings() {
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  useEffect(() => {
    // Update logo URL whenever settings change
    if (settings?.logoUrl) {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const fullUrl = settings.logoUrl.startsWith('http') 
        ? settings.logoUrl 
        : `${baseUrl}${settings.logoUrl}`
      console.log('🖼️ Logo URL constructed:', fullUrl, 'from:', settings.logoUrl)
      setLogoUrl(fullUrl)
    } else {
      console.log('⚠️ No logo URL in settings')
      setLogoUrl(null)
    }
  }, [settings])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('📡 Fetching company settings from useCompanySettings...')
      const response = await apiService.get<CompanySettings>('/company-settings')
      console.log('✅ Company settings received:', response)
      setSettings(response)
    } catch (err) {
      console.error('❌ Error fetching company settings:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  return {
    settings,
    loading,
    error,
    logoUrl,
    companyName: settings?.companyName || 'Clínica Belleza',
    refetch: fetchSettings
  }
}

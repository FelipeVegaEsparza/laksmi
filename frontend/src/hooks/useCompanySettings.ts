'use client'

import { useState, useEffect } from 'react'

interface CompanySettings {
  id: string
  companyName: string
  companyDescription?: string
  logoUrl?: string
  contactAddress?: string
  contactEmail?: string
  contactPhone?: string
  facebookUrl?: string
  instagramUrl?: string
  tiktokUrl?: string
  xUrl?: string
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
    if (settings?.logoUrl) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3000'
      const fullUrl = settings.logoUrl.startsWith('http') 
        ? settings.logoUrl 
        : `${apiUrl}${settings.logoUrl}`
      setLogoUrl(fullUrl)
    } else {
      setLogoUrl(null)
    }
  }, [settings])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'
      const response = await fetch(`${apiUrl}/company-settings`)
      const data = await response.json()
      
      if (data.success && data.data) {
        setSettings(data.data)
      }
    } catch (err) {
      console.error('Error fetching company settings:', err)
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
    contactAddress: settings?.contactAddress,
    contactEmail: settings?.contactEmail,
    contactPhone: settings?.contactPhone,
    facebookUrl: settings?.facebookUrl,
    instagramUrl: settings?.instagramUrl,
    tiktokUrl: settings?.tiktokUrl,
    xUrl: settings?.xUrl,
    refetch: fetchSettings
  }
}

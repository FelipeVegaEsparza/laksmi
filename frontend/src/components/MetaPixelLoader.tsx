'use client'

import { useEffect, useState } from 'react'
import MetaPixel from './MetaPixel'

export default function MetaPixelLoader() {
  const [pixelId, setPixelId] = useState<string | null>(null)

  useEffect(() => {
    const fetchPixelId = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const response = await fetch(`${apiUrl}/company-settings`, {
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          if (data.metaPixelId) {
            setPixelId(data.metaPixelId)
          }
        }
      } catch (error) {
        // Silenciar errores - Meta Pixel es opcional
      }
    }

    fetchPixelId()
  }, [])

  if (!pixelId) return null

  return <MetaPixel pixelId={pixelId} />
}

'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Button from './Button'

interface Banner {
  id: string
  title: string
  description?: string
  link?: string
  imageUrl?: string
  order: number
  active: boolean
}

export default function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBanners()
  }, [])

  useEffect(() => {
    if (banners.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length)
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(interval)
  }, [banners.length])

  const fetchBanners = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'
      const response = await fetch(`${apiUrl}/banners?activeOnly=true`)
      const data = await response.json()
      
      if (data.success && data.data) {
        setBanners(data.data)
      }
    } catch (error) {
      console.error('Error fetching banners:', error)
    } finally {
      setLoading(false)
    }
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  const getImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return '/placeholder-banner.jpg'
    if (imageUrl.startsWith('http')) return imageUrl
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3000'
    return `${baseUrl}${imageUrl}`
  }

  if (loading) {
    return (
      <div className="w-full h-96 bg-gray-200 animate-pulse flex items-center justify-center">
        <p className="text-gray-500">Cargando banners...</p>
      </div>
    )
  }

  if (banners.length === 0) {
    return null // Don't show carousel if no banners
  }

  const currentBanner = banners[currentIndex]
  const imageUrl = getImageUrl(currentBanner.imageUrl)

  return (
    <div className="w-full pt-4 md:pt-6 pb-2 md:pb-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[450px] overflow-hidden rounded-lg shadow-lg group">
          {/* Banner Image */}
          <img
            src={imageUrl}
            alt={currentBanner.title}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 1,
              display: 'block',
            }}
            onError={() => {
              console.error('Failed to load banner image:', imageUrl)
            }}
          />
          
          {/* Overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            zIndex: 2,
          }} />

          {/* Content */}
          <div style={{
            position: 'relative',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 3,
          }}>
            <div className="max-w-4xl mx-auto text-center text-white">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4 drop-shadow-lg">
                {currentBanner.title}
              </h1>
              {currentBanner.description && (
                <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-4 md:mb-6 drop-shadow-lg max-w-2xl mx-auto">
                  {currentBanner.description}
                </p>
              )}
              {currentBanner.link && (
                <Button
                  href={currentBanner.link}
                  variant="primary"
                  size="md"
                >
                  Más Información
                </Button>
              )}
            </div>
          </div>

          {/* Navigation Arrows */}
          {banners.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-1.5 md:p-2 rounded-full bg-white/30 hover:bg-white/50 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                aria-label="Banner anterior"
                style={{ zIndex: 4 }}
              >
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-1.5 md:p-2 rounded-full bg-white/30 hover:bg-white/50 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                aria-label="Siguiente banner"
                style={{ zIndex: 4 }}
              >
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </button>
            </>
          )}

          {/* Dots Indicator */}
          {banners.length > 1 && (
            <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-2" style={{ zIndex: 4 }}>
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all ${
                    index === currentIndex
                      ? 'w-6 md:w-8'
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                  style={{
                    backgroundColor: index === currentIndex ? 'var(--color-primary)' : undefined
                  }}
                  aria-label={`Ir al banner ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

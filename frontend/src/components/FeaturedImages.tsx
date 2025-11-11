'use client'

import { useState, useEffect } from 'react'

interface FeaturedImage {
  id: string
  slot: number
  title: string
  description?: string
  imageUrl?: string
  active: boolean
}

export default function FeaturedImages() {
  const [images, setImages] = useState<FeaturedImage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchImages()
  }, [])

  const fetchImages = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'
      const response = await fetch(`${apiUrl}/featured-images`)
      const data = await response.json()
      
      if (data.success && data.data) {
        // Only show active images
        const activeImages = data.data.filter((img: FeaturedImage) => img.active)
        setImages(activeImages)
      }
    } catch (error) {
      console.error('Error fetching featured images:', error)
    } finally {
      setLoading(false)
    }
  }

  const getImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return null
    if (imageUrl.startsWith('http')) return imageUrl
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3000'
    return `${baseUrl}${imageUrl}`
  }

  if (loading || images.length === 0) {
    return null
  }

  return (
    <div className="w-full pt-2 md:pt-3 pb-6 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {images.map((image) => {
            const imageUrl = getImageUrl(image.imageUrl)
            if (!imageUrl) return null

            return (
              <div
                key={image.id}
                className="overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 group"
                style={{
                  position: 'relative',
                  width: '100%',
                  paddingBottom: '42.86%', // 21:9 aspect ratio
                }}
              >
                <img
                  src={imageUrl}
                  alt={image.title}
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
                  onError={(e) => {
                    console.error('Failed to load featured image:', imageUrl)
                  }}
                />
                
                {/* Text overlay */}
                {(image.title || image.description) && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                    padding: '1rem',
                    zIndex: 2,
                  }}>
                    {image.title && (
                      <h3 style={{
                        color: 'white',
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        marginBottom: '0.25rem',
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                      }}>
                        {image.title}
                      </h3>
                    )}
                    {image.description && (
                      <p style={{
                        color: 'rgba(255,255,255,0.9)',
                        fontSize: '0.875rem',
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {image.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

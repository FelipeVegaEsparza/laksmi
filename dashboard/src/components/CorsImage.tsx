import React, { useState, useEffect } from 'react'
import { uploadService } from '@/services/uploadService'

interface CorsImageProps {
  src: string
  alt: string
  className?: string
  fallback?: string
}

export const CorsImage: React.FC<CorsImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  fallback = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBObyBEaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg=='
}) => {
  const [imageSrc, setImageSrc] = useState<string>(src)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    setHasError(false)
    
    if (src) {
      // Simplificar: usar directamente la URL procesada sin preload complejo
      const processedUrl = uploadService.getImageUrl(src)
      setImageSrc(processedUrl)
      setIsLoading(false)
    } else {
      setImageSrc(fallback)
      setIsLoading(false)
    }
  }, [src, fallback])

  const handleImageError = () => {
    if (!hasError) {
      console.warn('❌ Image failed to load, using fallback:', src)
      setHasError(true)
      setImageSrc(fallback)
    }
  }

  const handleImageLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  if (isLoading) {
    return (
      <div className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}>
        <span className="text-gray-500 text-sm">Cargando...</span>
      </div>
    )
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={handleImageError}
      onLoad={handleImageLoad}
    />
  )
}

export default CorsImage
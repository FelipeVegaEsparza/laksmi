import React, { useState } from 'react'
import { uploadService } from '@/services/uploadService'

interface SimpleImageProps {
  src: string
  alt: string
  className?: string
}

export const SimpleImage: React.FC<SimpleImageProps> = ({ 
  src, 
  alt, 
  className = ''
}) => {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(false) // Iniciar en false

  // Fallback SVG local
  const fallbackSvg = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBObyBEaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg=='

  const handleImageError = () => {
    console.warn('❌ SimpleImage failed to load:', src)
    setHasError(true)
  }

  const handleImageLoad = () => {
    console.log('✅ SimpleImage loaded successfully:', src)
    setHasError(false)
  }

  // Procesar URL directamente sin preload
  const imageUrl = uploadService.getImageUrl(src)

  return (
    <img
      src={hasError ? fallbackSvg : imageUrl}
      alt={alt}
      className={className}
      onError={handleImageError}
      onLoad={handleImageLoad}
    />
  )
}

export default SimpleImage
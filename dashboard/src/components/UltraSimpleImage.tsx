import React from 'react'
import { uploadService } from '@/services/uploadService'

interface UltraSimpleImageProps {
  src: string
  alt: string
  className?: string
}

export const UltraSimpleImage: React.FC<UltraSimpleImageProps> = ({ 
  src, 
  alt, 
  className = ''
}) => {
  // Fallback SVG local
  const fallbackSvg = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBObyBEaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg=='

  // Procesar URL directamente
  const imageUrl = uploadService.getImageUrl(src)

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Solo cambiar a fallback si no es ya el fallback
    if (e.currentTarget.src !== fallbackSvg) {
      console.warn('❌ UltraSimpleImage failed, using fallback:', src)
      e.currentTarget.src = fallbackSvg
    }
  }

  const handleLoad = () => {
    console.log('✅ UltraSimpleImage loaded:', src)
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      onError={handleError}
      onLoad={handleLoad}
    />
  )
}

export default UltraSimpleImage
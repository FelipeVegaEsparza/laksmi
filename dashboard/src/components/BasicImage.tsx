import React from 'react'
import { uploadService } from '@/services/uploadService'

interface BasicImageProps {
  src: string
  alt: string
  className?: string
}

export const BasicImage: React.FC<BasicImageProps> = ({ 
  src, 
  alt, 
  className = ''
}) => {
  // Procesar URL directamente
  const imageUrl = uploadService.getImageUrl(src)

  console.log('🔍 BasicImage rendering:', imageUrl)

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      crossOrigin="anonymous"
      onLoad={() => console.log('✅ BasicImage loaded:', imageUrl)}
      onError={() => console.log('❌ BasicImage error:', imageUrl)}
    />
  )
}

export default BasicImage
'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { themeColors } from '@/utils/colors';

interface ServiceImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

const ServiceImage = ({ src, alt, className = '', fallbackClassName = '' }: ServiceImageProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Decodificar entidades HTML en la URL
  const decodeImageUrl = (url: string): string => {
    if (!url) return '';
    const decoded = url
      .replace(/&#x2F;/g, '/')
      .replace(/&amp;/g, '&')
      .replace(/&#x3A;/g, ':');
    return decoded;
  };

  // Construir URL completa si es una ruta relativa
  const getFullImageUrl = (url: string): string => {
    if (!url) return '';
    
    // Si ya es una URL completa, devolverla tal cual
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Si es una ruta relativa, construir URL completa con el backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const baseUrl = apiUrl.replace('/api/v1', ''); // Remover /api/v1 del final
    return `${baseUrl}${url}`;
  };

  const decodedSrc = decodeImageUrl(src);
  const fullImageUrl = getFullImageUrl(decodedSrc);

  if (imageError || !src) {
    return (
      <div 
        className={`flex items-center justify-center ${fallbackClassName}`}
        style={{ background: themeColors.gradientLight }}
      >
        <Sparkles 
          className="h-16 w-16" 
          style={{ color: themeColors.primary }}
        />
      </div>
    );
  }

  return (
    <>
      {!imageLoaded && (
        <div 
          className={`flex items-center justify-center ${fallbackClassName}`}
          style={{ background: themeColors.gradientLight }}
        >
          <div className="animate-pulse">
            <Sparkles 
              className="h-16 w-16" 
              style={{ color: themeColors.primary }}
            />
          </div>
        </div>
      )}
      <img
        src={fullImageUrl}
        alt={alt}
        className={`${className} ${!imageLoaded ? 'hidden' : ''}`}
        onLoad={() => setImageLoaded(true)}
        onError={(e) => {
          console.error('Error loading image:', fullImageUrl);
          setImageError(true);
        }}
      />
    </>
  );
};

export default ServiceImage;

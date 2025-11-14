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

  const decodedSrc = decodeImageUrl(src);

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
        src={decodedSrc}
        alt={alt}
        className={`${className} ${!imageLoaded ? 'hidden' : ''}`}
        onLoad={() => setImageLoaded(true)}
        onError={(e) => {
          console.error('Error loading image:', decodedSrc);
          setImageError(true);
        }}
      />
    </>
  );
};

export default ServiceImage;

'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';

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
      <div className={`flex items-center justify-center bg-gradient-to-br from-rose-200 to-pink-300 ${fallbackClassName}`}>
        <Sparkles className="h-16 w-16 text-rose-600" />
      </div>
    );
  }

  return (
    <>
      {!imageLoaded && (
        <div className={`flex items-center justify-center bg-gradient-to-br from-rose-200 to-pink-300 ${fallbackClassName}`}>
          <div className="animate-pulse">
            <Sparkles className="h-16 w-16 text-rose-400" />
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

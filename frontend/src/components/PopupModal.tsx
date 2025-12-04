'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Popup {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  displayOrder: number;
  isActive: boolean;
}

export default function PopupModal() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPopups();
  }, []);

  const fetchPopups = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
      const response = await fetch(`${apiUrl}/popups/active`);
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        setPopups(data.data);
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Error fetching popups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? popups.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === popups.length - 1 ? 0 : prev + 1));
  };

  const handleImageClick = () => {
    if (popups[currentIndex]?.linkUrl) {
      window.open(popups[currentIndex].linkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const getImageUrl = (imageUrl: string) => {
    if (imageUrl.startsWith('http')) return imageUrl;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';
    return `${apiUrl}${imageUrl}`;
  };

  if (loading || !isOpen || popups.length === 0) {
    return null;
  }

  const currentPopup = popups[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Botón de cerrar */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
          aria-label="Cerrar"
        >
          <X className="h-6 w-6 text-gray-700" />
        </button>

        {/* Imagen del popup */}
        <div className="relative">
          <img
            src={getImageUrl(currentPopup.imageUrl)}
            alt={currentPopup.title}
            className="w-full h-auto cursor-pointer"
            onClick={handleImageClick}
            style={{ maxHeight: '80vh', objectFit: 'contain' }}
          />
        </div>

        {/* Controles del carrusel (solo si hay más de un popup) */}
        {popups.length > 1 && (
          <>
            {/* Botón anterior */}
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-6 w-6 text-gray-700" />
            </button>

            {/* Botón siguiente */}
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
              aria-label="Siguiente"
            >
              <ChevronRight className="h-6 w-6 text-gray-700" />
            </button>

            {/* Indicadores de posición */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {popups.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? 'bg-white w-8'
                      : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                  }`}
                  aria-label={`Ir al popup ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

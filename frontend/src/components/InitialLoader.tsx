'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function InitialLoader() {
  const { isLoaded } = useTheme();
  const [shouldHide, setShouldHide] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      // Pequeño delay para asegurar que los estilos se aplicaron
      setTimeout(() => {
        setShouldHide(true);
      }, 200);
    }
  }, [isLoaded]);

  // Timeout de seguridad: ocultar loader después de 3 segundos máximo
  useEffect(() => {
    const timeout = setTimeout(() => {
      setShouldHide(true);
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  if (shouldHide) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity duration-500"
      style={{
        opacity: shouldHide ? 0 : 1,
        pointerEvents: shouldHide ? 'none' : 'auto',
      }}
    >
      <div className="flex flex-col items-center space-y-6">
        {/* Logo o nombre de la clínica */}
        <div className="text-4xl font-bold text-gray-800 animate-pulse">
          Clínica de Belleza
        </div>

        {/* Spinner elegante con múltiples círculos */}
        <div className="relative w-20 h-20">
          {/* Círculo exterior estático */}
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
          
          {/* Círculo animado 1 */}
          <div
            className="absolute inset-0 border-4 border-transparent rounded-full animate-spin"
            style={{
              borderTopColor: '#e11d48',
              borderRightColor: '#e11d48',
              animationDuration: '1s',
            }}
          ></div>
          
          {/* Círculo animado 2 (más pequeño, rotación inversa) */}
          <div
            className="absolute inset-2 border-4 border-transparent rounded-full animate-spin-reverse"
            style={{
              borderBottomColor: '#9333ea',
              borderLeftColor: '#9333ea',
              animationDuration: '1.5s',
            }}
          ></div>
          
          {/* Punto central */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: '#e11d48' }}
            ></div>
          </div>
        </div>

        {/* Texto de carga con animación de puntos */}
        <div className="text-sm text-gray-500 flex items-center space-x-1">
          <span>Cargando</span>
          <span className="animate-bounce" style={{ animationDelay: '0s' }}>.</span>
          <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
          <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>.</span>
        </div>
      </div>
    </div>
  );
}

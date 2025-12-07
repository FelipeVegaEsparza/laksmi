'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Clock, AlertCircle } from 'lucide-react';

export default function MaintenancePage() {
  const router = useRouter();

  useEffect(() => {
    // Verificar cada 30 segundos si el sitio sigue en mantenimiento
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/company-settings`);
        const data = await response.json();
        
        if (data.success && !data.data.maintenanceMode) {
          // Si ya no está en mantenimiento, redirigir al home
          router.push('/');
        }
      } catch (error) {
        console.error('Error checking maintenance mode:', error);
      }
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500 rounded-full opacity-20 animate-ping"></div>
              <div className="relative bg-orange-500 rounded-full p-6">
                <Settings className="h-16 w-16 text-white animate-spin" style={{ animationDuration: '3s' }} />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Sitio en Mantenimiento
          </h1>

          {/* Description */}
          <p className="text-xl text-gray-600 mb-8">
            Estamos realizando mejoras para brindarte una mejor experiencia.
          </p>

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
              <Clock className="h-8 w-8 text-orange-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Tiempo Estimado</h3>
              <p className="text-gray-600 text-sm">
                Estaremos de vuelta pronto
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <AlertCircle className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">¿Necesitas Ayuda?</h3>
              <p className="text-gray-600 text-sm">
                Contáctanos por WhatsApp
              </p>
            </div>
          </div>

          {/* Message */}
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <p className="text-gray-700">
              Estamos trabajando para mejorar nuestros servicios. 
              <br />
              <span className="font-semibold">¡Gracias por tu paciencia!</span>
            </p>
          </div>

          {/* Auto-refresh notice */}
          <p className="text-sm text-gray-500 mt-6">
            Esta página se actualizará automáticamente cuando el sitio esté disponible
          </p>
        </div>
      </div>
    </div>
  );
}

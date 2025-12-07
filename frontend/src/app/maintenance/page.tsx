'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Clock, MessageCircle } from 'lucide-react';
import { useCompanySettings } from '@/hooks/useCompanySettings';

export default function MaintenancePage() {
  const router = useRouter();
  const { logoUrl, companyName, contactWhatsapp } = useCompanySettings();

  useEffect(() => {
    console.log('🖼️ Maintenance - Logo URL:', logoUrl);
    console.log('🏢 Maintenance - Company Name:', companyName);
  }, [logoUrl, companyName]);

  useEffect(() => {
    // Verificar cada 30 segundos si el sitio sigue en mantenimiento
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/company-settings`);
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

  const handleWhatsAppClick = () => {
    if (contactWhatsapp) {
      const phone = contactWhatsapp.replace(/\D/g, '');
      const message = encodeURIComponent('Hola! Vi que el sitio está en mantenimiento. ¿Puedo hacer una consulta?');
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: 'linear-gradient(135deg, var(--color-primary-light, #f0f9ff) 0%, var(--color-background, #ffffff) 100%)'
      }}
    >
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            {logoUrl ? (
              <div className="w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
                <img
                  src={logoUrl}
                  alt={companyName}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    console.error('Error loading logo:', logoUrl);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="relative">
                <div 
                  className="absolute inset-0 rounded-full opacity-20 animate-ping"
                  style={{ backgroundColor: 'var(--color-primary, #0370dd)' }}
                ></div>
                <div 
                  className="relative rounded-full p-6"
                  style={{ backgroundColor: 'var(--color-primary, #0370dd)' }}
                >
                  <Settings className="h-16 w-16 text-white animate-spin" style={{ animationDuration: '3s' }} />
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--color-text, #000000)' }}>
            Sitio en Mantenimiento
          </h1>

          {/* Description */}
          <p className="text-xl mb-8" style={{ color: 'var(--color-text-secondary, #6b7280)' }}>
            Estamos realizando mejoras para brindarte una mejor experiencia.
          </p>

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div 
              className="rounded-lg p-6 border-2 transition-all duration-300 hover:shadow-lg"
              style={{ 
                backgroundColor: 'var(--color-primary-light, #f0f9ff)',
                borderColor: 'var(--color-primary, #0370dd)'
              }}
            >
              <Clock 
                className="h-8 w-8 mx-auto mb-3" 
                style={{ color: 'var(--color-primary, #0370dd)' }}
              />
              <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text, #000000)' }}>
                Tiempo Estimado
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary, #6b7280)' }}>
                Estaremos de vuelta pronto
              </p>
            </div>

            <div 
              className="rounded-lg p-6 border-2 transition-all duration-300 hover:shadow-lg cursor-pointer"
              style={{ 
                backgroundColor: 'var(--color-secondary-light, #fdf2f8)',
                borderColor: 'var(--color-secondary, #dc004e)'
              }}
              onClick={handleWhatsAppClick}
            >
              <MessageCircle 
                className="h-8 w-8 mx-auto mb-3" 
                style={{ color: 'var(--color-secondary, #dc004e)' }}
              />
              <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text, #000000)' }}>
                ¿Necesitas Ayuda?
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary, #6b7280)' }}>
                Contáctanos por WhatsApp
              </p>
            </div>
          </div>

          {/* Message */}
          <div 
            className="rounded-lg p-6 border"
            style={{ 
              backgroundColor: 'var(--color-background, #f9fafb)',
              borderColor: 'var(--color-border, #e5e7eb)'
            }}
          >
            <p style={{ color: 'var(--color-text, #000000)' }}>
              Estamos trabajando para mejorar nuestros servicios. 
              <br />
              <span className="font-semibold">¡Gracias por tu paciencia!</span>
            </p>
          </div>

          {/* Auto-refresh notice */}
          <p className="text-sm mt-6" style={{ color: 'var(--color-text-secondary, #9ca3af)' }}>
            Esta página se actualizará automáticamente cuando el sitio esté disponible
          </p>
        </div>
      </div>
    </div>
  );
}

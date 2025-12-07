'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, MessageCircle } from 'lucide-react';
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

          {/* Message */}
          <div 
            className="rounded-xl p-8 mb-8 border-2"
            style={{ 
              backgroundColor: 'var(--color-background, #f9fafb)',
              borderColor: 'var(--color-border, #e5e7eb)'
            }}
          >
            <p className="text-lg mb-2" style={{ color: 'var(--color-text, #000000)' }}>
              Estamos trabajando para mejorar nuestros servicios.
            </p>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-primary, #0370dd)' }}>
              ¡Gracias por tu paciencia!
            </p>
          </div>

          {/* WhatsApp CTA */}
          <div 
            className="rounded-2xl p-8 border-2 transition-all duration-300 hover:shadow-2xl hover:scale-105 cursor-pointer group"
            style={{ 
              background: `linear-gradient(135deg, var(--color-primary, #0370dd) 0%, var(--color-secondary, #dc004e) 100%)`,
              borderColor: 'transparent'
            }}
            onClick={handleWhatsAppClick}
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="bg-white rounded-full p-4 group-hover:scale-110 transition-transform duration-300">
                <MessageCircle className="h-10 w-10" style={{ color: 'var(--color-primary, #0370dd)' }} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              ¿Necesitas Ayuda?
            </h3>
            <p className="text-white text-opacity-90 mb-4">
              Nuestro equipo está disponible para atenderte
            </p>
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-6 py-3 inline-block">
              <p className="text-white font-semibold">
                Contáctanos por WhatsApp →
              </p>
            </div>
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

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
          <p className="text-lg mb-10 leading-relaxed" style={{ color: 'var(--color-text-secondary, #6b7280)' }}>
            Estamos realizando mejoras para brindarte una mejor experiencia.
            <br />
            <span className="font-semibold" style={{ color: 'var(--color-text, #000000)' }}>
              Volveremos pronto.
            </span>
          </p>

          {/* Divider */}
          <div className="w-24 h-1 mx-auto mb-10 rounded-full" style={{ backgroundColor: 'var(--color-primary, #0370dd)' }}></div>

          {/* WhatsApp Section */}
          <div className="space-y-4">
            <p className="text-base" style={{ color: 'var(--color-text-secondary, #6b7280)' }}>
              ¿Necesitas hacer una consulta o agendar una cita?
            </p>
            
            <button
              onClick={handleWhatsAppClick}
              className="w-full max-w-md mx-auto flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              style={{ 
                backgroundColor: '#25D366',
              }}
            >
              <MessageCircle className="h-6 w-6" />
              <span>Contáctanos por WhatsApp</span>
            </button>

            <p className="text-sm" style={{ color: 'var(--color-text-secondary, #9ca3af)' }}>
              Nuestro equipo está disponible para atenderte
            </p>
          </div>

          {/* Spacer */}
          <div className="mt-12"></div>

          {/* Auto-refresh notice */}
          <p className="text-sm mt-6" style={{ color: 'var(--color-text-secondary, #9ca3af)' }}>
            Esta página se actualizará automáticamente cuando el sitio esté disponible
          </p>
        </div>
      </div>
    </div>
  );
}

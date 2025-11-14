import Link from 'next/link';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { themeColors } from '@/utils/colors';

const Footer = () => {
  const { 
    companyName,
    logoUrl,
    settings,
    contactAddress, 
    contactEmail, 
    contactPhone,
    facebookUrl,
    instagramUrl,
    tiktokUrl,
    xUrl
  } = useCompanySettings();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            {/* Logo con filtro para hacerlo blanco/claro */}
            <div className="mb-4">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={companyName}
                  className="h-16 w-auto object-contain"
                  style={{
                    filter: 'brightness(0) invert(1)',
                    maxWidth: '180px'
                  }}
                />
              ) : (
                <h3 className="text-xl font-bold text-white">{companyName}</h3>
              )}
            </div>
            <p className="text-gray-300 mb-4">
              {settings?.companyDescription || 'Tu centro de belleza de confianza. Ofrecemos los mejores tratamientos con tecnología de vanguardia y productos de alta calidad.'}
            </p>
            <div className="flex space-x-4">
              {facebookUrl && (
                <a 
                  href={facebookUrl} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 transition-colors duration-300 hover-lift"
                  onMouseEnter={(e) => e.currentTarget.style.color = themeColors.primary}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                  aria-label="Facebook"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              )}
              {instagramUrl && (
                <a 
                  href={instagramUrl} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 transition-colors duration-300 hover-lift"
                  onMouseEnter={(e) => e.currentTarget.style.color = themeColors.primary}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                  aria-label="Instagram"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              )}
              {tiktokUrl && (
                <a 
                  href={tiktokUrl} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 transition-colors duration-300 hover-lift"
                  onMouseEnter={(e) => e.currentTarget.style.color = themeColors.primary}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                  aria-label="TikTok"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
              )}
              {xUrl && (
                <a 
                  href={xUrl} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 transition-colors duration-300 hover-lift"
                  onMouseEnter={(e) => e.currentTarget.style.color = themeColors.primary}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                  aria-label="X (Twitter)"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/contacto" 
                  className="text-gray-300 transition-colors duration-300"
                  onMouseEnter={(e) => e.currentTarget.style.color = themeColors.primary}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#d1d5db'}
                >
                  Contacto
                </Link>
              </li>
              <li>
                <Link 
                  href="/terminos" 
                  className="text-gray-300 transition-colors duration-300"
                  onMouseEnter={(e) => e.currentTarget.style.color = themeColors.primary}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#d1d5db'}
                >
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link 
                  href="/consentimiento-informado" 
                  className="text-gray-300 transition-colors duration-300"
                  onMouseEnter={(e) => e.currentTarget.style.color = themeColors.primary}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#d1d5db'}
                >
                  Consentimientos Informados
                </Link>
              </li>
              <li>
                <Link 
                  href="/politica-de-privacidad" 
                  className="text-gray-300 transition-colors duration-300"
                  onMouseEnter={(e) => e.currentTarget.style.color = themeColors.primary}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#d1d5db'}
                >
                  Política de Privacidad
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Servicios Populares</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/servicios/facial" 
                  className="text-gray-300 transition-colors duration-300"
                  onMouseEnter={(e) => e.currentTarget.style.color = themeColors.primary}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#d1d5db'}
                >
                  Tratamientos Faciales
                </Link>
              </li>
              <li>
                <Link 
                  href="/servicios/corporal" 
                  className="text-gray-300 transition-colors duration-300"
                  onMouseEnter={(e) => e.currentTarget.style.color = themeColors.primary}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#d1d5db'}
                >
                  Tratamientos Corporales
                </Link>
              </li>
              <li>
                <Link 
                  href="/servicios/spa" 
                  className="text-gray-300 transition-colors duration-300"
                  onMouseEnter={(e) => e.currentTarget.style.color = themeColors.primary}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#d1d5db'}
                >
                  Spa y Relajación
                </Link>
              </li>
              <li>
                <Link 
                  href="/servicios/estetica" 
                  className="text-gray-300 transition-colors duration-300"
                  onMouseEnter={(e) => e.currentTarget.style.color = themeColors.primary}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#d1d5db'}
                >
                  Estética Avanzada
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contacto</h4>
            <div className="space-y-3">
              {contactAddress && (
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" style={{ color: themeColors.primary }} />
                  <span className="text-gray-300">{contactAddress}</span>
                </div>
              )}
              {contactPhone && (
                <div className="flex items-center">
                  <Phone className="h-5 w-5 mr-3 flex-shrink-0" style={{ color: themeColors.primary }} />
                  <a 
                    href={`tel:${contactPhone}`}
                    className="text-gray-300 transition-colors duration-300"
                    onMouseEnter={(e) => e.currentTarget.style.color = themeColors.primary}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#d1d5db'}
                  >
                    {contactPhone}
                  </a>
                </div>
              )}
              {contactEmail && (
                <div className="flex items-center">
                  <Mail className="h-5 w-5 mr-3 flex-shrink-0" style={{ color: themeColors.primary }} />
                  <a 
                    href={`mailto:${contactEmail}`}
                    className="text-gray-300 transition-colors duration-300"
                    onMouseEnter={(e) => e.currentTarget.style.color = themeColors.primary}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#d1d5db'}
                  >
                    {contactEmail}
                  </a>
                </div>
              )}
              <div className="flex items-start">
                <Clock className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" style={{ color: themeColors.primary }} />
                <div className="text-gray-300">
                  <p>Lun - Vie: 9:00 - 20:00</p>
                  <p>Sáb: 9:00 - 18:00</p>
                  <p>Dom: Cerrado</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} {companyName}. Todos los derechos reservados.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link 
                href="/privacidad" 
                className="text-gray-400 text-sm transition-colors duration-300"
                onMouseEnter={(e) => e.currentTarget.style.color = themeColors.primary}
                onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
              >
                Política de Privacidad
              </Link>
              <Link 
                href="/terminos" 
                className="text-gray-400 text-sm transition-colors duration-300"
                onMouseEnter={(e) => e.currentTarget.style.color = themeColors.primary}
                onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
              >
                Términos de Uso
              </Link>
              <Link 
                href="/cookies" 
                className="text-gray-400 text-sm transition-colors duration-300"
                onMouseEnter={(e) => e.currentTarget.style.color = themeColors.primary}
                onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
              >
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
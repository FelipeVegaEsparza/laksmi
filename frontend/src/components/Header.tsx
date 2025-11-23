'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Menu, 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  Home,
  Sparkles,
  ShoppingBag,
  Calendar,
  MessageCircle,
  Search
} from 'lucide-react';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import Button from './Button';

const Header = () => {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'services' | 'products'>('all');
  const { 
    logoUrl, 
    companyName, 
    contactAddress, 
    contactEmail, 
    contactPhone,
    facebookUrl,
    instagramUrl,
    tiktokUrl,
    xUrl
  } = useCompanySettings();

  const navigation = [
    { name: 'Inicio', href: '/', icon: Home },
    { name: 'Servicios', href: '/servicios', icon: Sparkles },
    { name: 'Productos', href: '/productos', icon: ShoppingBag },
    { name: 'Contacto', href: '/contacto', icon: MessageCircle },
  ];

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!searchQuery.trim()) return;

    // Construir la URL según el tipo de búsqueda
    const encodedQuery = encodeURIComponent(searchQuery.trim());
    
    if (searchType === 'all') {
      // Buscar en servicios primero, luego en productos
      router.push(`/servicios?search=${encodedQuery}`);
    } else if (searchType === 'services') {
      router.push(`/servicios?search=${encodedQuery}`);
    } else {
      router.push(`/productos?search=${encodedQuery}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      {/* Top bar with contact info - Más elegante */}
      <div className="border-b border-gray-100" style={{ 
        background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 8%, white) 0%, color-mix(in srgb, var(--color-primary) 12%, white) 100%)'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-2.5 text-sm">
            {/* Información de contacto */}
            <div className="flex items-center space-x-6">
              {contactPhone && (
                <a 
                  href={`tel:${contactPhone}`}
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-all duration-300 font-medium group"
                >
                  <div className="p-1.5 rounded-lg bg-white/60 group-hover:bg-white transition-colors duration-300">
                    <Phone className="h-3.5 w-3.5" style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <span className="hidden sm:inline">{contactPhone}</span>
                </a>
              )}
              {contactEmail && (
                <a 
                  href={`mailto:${contactEmail}`}
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-all duration-300 font-medium group"
                >
                  <div className="p-1.5 rounded-lg bg-white/60 group-hover:bg-white transition-colors duration-300">
                    <Mail className="h-3.5 w-3.5" style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <span className="hidden sm:inline">{contactEmail}</span>
                </a>
              )}
              {contactAddress && (
                <div className="hidden lg:flex items-center gap-2 text-gray-700 font-medium">
                  <div className="p-1.5 rounded-lg bg-white/60">
                    <MapPin className="h-3.5 w-3.5" style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <span>{contactAddress}</span>
                </div>
              )}
            </div>

            {/* Redes sociales - Más elegantes */}
            <div className="flex items-center space-x-2">
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-white/60 hover:bg-white transition-all duration-300 hover:scale-110 group"
                  aria-label="Facebook"
                >
                  <svg className="h-3.5 w-3.5 text-gray-700 group-hover:text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              )}
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-white/60 hover:bg-white transition-all duration-300 hover:scale-110 group"
                  aria-label="Instagram"
                >
                  <svg className="h-3.5 w-3.5 text-gray-700 group-hover:text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              )}
              {tiktokUrl && (
                <a
                  href={tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-white/60 hover:bg-white transition-all duration-300 hover:scale-110 group"
                  aria-label="TikTok"
                >
                  <svg className="h-3.5 w-3.5 text-gray-700 group-hover:text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
              )}
              {xUrl && (
                <a
                  href={xUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-white/60 hover:bg-white transition-all duration-300 hover:scale-110 group"
                  aria-label="X (Twitter)"
                >
                  <svg className="h-3.5 w-3.5 text-gray-700 group-hover:text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main navigation - Diseño profesional y limpio */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-5">
          {/* Logo - Elegante */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center transition-all duration-300 hover:scale-105 hover:opacity-90">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={companyName}
                  style={{
                    height: '70px',
                    width: 'auto',
                    maxWidth: '180px',
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <span className="text-3xl font-bold tracking-tight" style={{ color: 'var(--color-primary)' }}>
                  {companyName}
                </span>
              )}
            </Link>
            {/* Imagen de resolución */}
            <img 
              src="/resolucion.png" 
              alt="Resolución Ministerio de Salud"
              className="h-10 sm:h-12 md:h-14 w-auto object-contain"
            />
          </div>

          {/* Desktop navigation - Minimalista y elegante */}
          <div className="hidden lg:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group relative flex items-center gap-2.5 px-6 py-3 text-gray-700 transition-all duration-300 font-medium"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--color-primary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = ''
                  }}
                >
                  <Icon className="h-4.5 w-4.5 transition-transform duration-300 group-hover:scale-110" />
                  <span className="text-[15px] font-medium">{item.name}</span>
                  {/* Indicador inferior elegante */}
                  <span 
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-0 transition-all duration-300 group-hover:w-12 rounded-full"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  />
                </Link>
              )
            })}
          </div>

          {/* CTA Button - Destacado y profesional */}
          <div className="hidden lg:flex">
            <Button 
              href="/servicios" 
              variant="primary" 
              size="md" 
              className="shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 font-semibold"
            >
              <Calendar className="h-4.5 w-4.5 mr-2" />
              Reservar Ahora
            </Button>
          </div>

          {/* Mobile menu button - Elegante */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2.5 rounded-xl text-gray-700 transition-all duration-300 hover:bg-gray-50"
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = ''
              }}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile navigation - Diseño mejorado */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 animate-fadeIn">
            <div className="py-5 space-y-2">
              {navigation.map((item, index) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-4 px-5 py-4 text-gray-700 transition-all duration-300 font-medium rounded-xl hover:shadow-sm"
                    onClick={() => setIsMenuOpen(false)}
                    style={{ animationDelay: `${index * 50}ms` }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--color-primary)'
                      e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-primary) 10%, white)'
                      e.currentTarget.style.transform = 'translateX(8px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = ''
                      e.currentTarget.style.backgroundColor = ''
                      e.currentTarget.style.transform = ''
                    }}
                  >
                    <div 
                      className="p-2 rounded-lg transition-colors duration-300"
                      style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, white)' }}
                    >
                      <Icon className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <span className="text-base">{item.name}</span>
                  </Link>
                )
              })}
              <div className="pt-3 px-2">
                <Button 
                  href="/servicios" 
                  variant="primary" 
                  fullWidth
                  onClick={() => setIsMenuOpen(false)}
                  className="shadow-md hover:shadow-lg transition-shadow duration-300"
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  Reservar Ahora
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Search Section - Diseño limpio y moderno */}
      <div className="border-t border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            {/* Search Type Selector - Más elegante */}
            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={() => setSearchType('all')}
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  searchType === 'all' 
                    ? 'shadow-md scale-105' 
                    : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'
                }`}
                style={searchType === 'all' ? {
                  backgroundColor: 'var(--color-primary)',
                  color: 'white'
                } : {}}
              >
                Todo
              </button>
              <button
                onClick={() => setSearchType('services')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  searchType === 'services' 
                    ? 'shadow-md scale-105' 
                    : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'
                }`}
                style={searchType === 'services' ? {
                  backgroundColor: 'var(--color-primary)',
                  color: 'white'
                } : {}}
              >
                <Sparkles className="h-4 w-4" />
                Servicios
              </button>
              <button
                onClick={() => setSearchType('products')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  searchType === 'products' 
                    ? 'shadow-md scale-105' 
                    : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'
                }`}
                style={searchType === 'products' ? {
                  backgroundColor: 'var(--color-primary)',
                  color: 'white'
                } : {}}
              >
                <ShoppingBag className="h-4 w-4" />
                Productos
              </button>
            </div>

            {/* Search Input - Más limpio */}
            <div className="relative flex-1 w-full">
              <form onSubmit={handleSearch} className="relative">
                <Search 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" 
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    searchType === 'all' 
                      ? 'Buscar servicios y productos...' 
                      : searchType === 'services'
                      ? 'Buscar servicios...'
                      : 'Buscar productos...'
                  }
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-md"
                  style={{
                    '--tw-ring-color': 'var(--color-primary)',
                  } as React.CSSProperties}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = ''
                  }}
                />
              </form>
            </div>

            {/* Search Button - Más elegante */}
            <button
              onClick={handleSearch}
              className="w-full md:w-auto px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 hover:-translate-y-0.5"
              style={{ backgroundColor: 'var(--color-primary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(1.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = ''
              }}
            >
              <Search className="h-4.5 w-4.5" />
              <span>Buscar</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
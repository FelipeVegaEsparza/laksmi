'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Phone, Mail, MapPin } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation = [
    { name: 'Inicio', href: '/' },
    { name: 'Servicios', href: '/servicios' },
    { name: 'Productos', href: '/productos' },
    { name: 'Reservar Cita', href: '/reservar' },
    { name: 'Contacto', href: '/contacto' },
  ];

  return (
    <header className="bg-white shadow-sm">
      {/* Top bar with contact info */}
      <div className="bg-rose-50 border-b border-rose-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-2 text-sm text-rose-700">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-1" />
                <span>+34 123 456 789</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-1" />
                <span>info@clinicabelleza.com</span>
              </div>
            </div>
            <div className="hidden md:flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              <span>Calle Belleza 123, Madrid</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-rose-600">
              Clínica Belleza
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-rose-600 transition-colors duration-200 font-medium"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:flex">
            <Link
              href="/reservar"
              className="bg-rose-600 text-white px-6 py-2 rounded-full hover:bg-rose-700 transition-colors duration-200 font-medium"
            >
              Reservar Ahora
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-rose-600 transition-colors duration-200"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="py-4 space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block text-gray-700 hover:text-rose-600 transition-colors duration-200 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <Link
                href="/reservar"
                className="block bg-rose-600 text-white px-6 py-2 rounded-full hover:bg-rose-700 transition-colors duration-200 font-medium text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Reservar Ahora
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
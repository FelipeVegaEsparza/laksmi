import Link from 'next/link';
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Twitter } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold text-rose-400 mb-4">Clínica Belleza</h3>
            <p className="text-gray-300 mb-4">
              Tu centro de belleza de confianza. Ofrecemos los mejores tratamientos 
              con tecnología de vanguardia y productos de alta calidad.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-rose-400 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-rose-400 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-rose-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/servicios" className="text-gray-300 hover:text-rose-400 transition-colors">
                  Nuestros Servicios
                </Link>
              </li>
              <li>
                <Link href="/productos" className="text-gray-300 hover:text-rose-400 transition-colors">
                  Productos
                </Link>
              </li>
              <li>
                <Link href="/reservar" className="text-gray-300 hover:text-rose-400 transition-colors">
                  Reservar Cita
                </Link>
              </li>
              <li>
                <Link href="/sobre-nosotros" className="text-gray-300 hover:text-rose-400 transition-colors">
                  Sobre Nosotros
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="text-gray-300 hover:text-rose-400 transition-colors">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Servicios Populares</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/servicios/facial" className="text-gray-300 hover:text-rose-400 transition-colors">
                  Tratamientos Faciales
                </Link>
              </li>
              <li>
                <Link href="/servicios/corporal" className="text-gray-300 hover:text-rose-400 transition-colors">
                  Tratamientos Corporales
                </Link>
              </li>
              <li>
                <Link href="/servicios/spa" className="text-gray-300 hover:text-rose-400 transition-colors">
                  Spa y Relajación
                </Link>
              </li>
              <li>
                <Link href="/servicios/estetica" className="text-gray-300 hover:text-rose-400 transition-colors">
                  Estética Avanzada
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contacto</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-rose-400 mr-3" />
                <span className="text-gray-300">Calle Belleza 123, Madrid</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-rose-400 mr-3" />
                <span className="text-gray-300">+34 123 456 789</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-rose-400 mr-3" />
                <span className="text-gray-300">info@clinicabelleza.com</span>
              </div>
              <div className="flex items-start">
                <Clock className="h-5 w-5 text-rose-400 mr-3 mt-0.5" />
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
              © 2024 Clínica Belleza. Todos los derechos reservados.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacidad" className="text-gray-400 hover:text-rose-400 text-sm transition-colors">
                Política de Privacidad
              </Link>
              <Link href="/terminos" className="text-gray-400 hover:text-rose-400 text-sm transition-colors">
                Términos de Uso
              </Link>
              <Link href="/cookies" className="text-gray-400 hover:text-rose-400 text-sm transition-colors">
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
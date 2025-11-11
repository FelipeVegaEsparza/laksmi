'use client';

import Layout from '@/components/Layout';
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';

const ContactPage = () => {
  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Contacto
            </h1>
            <p className="text-xl text-gray-600">
              Estamos aquí para ayudarte. Contáctanos por cualquier medio.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Información de Contacto
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <MapPin className="h-6 w-6 text-rose-600 mr-4 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Dirección</h3>
                    <p className="text-gray-600">Calle Belleza 123, Madrid, España</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Phone className="h-6 w-6 text-rose-600 mr-4 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Teléfono</h3>
                    <p className="text-gray-600">+34 123 456 789</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Mail className="h-6 w-6 text-rose-600 mr-4 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Email</h3>
                    <p className="text-gray-600">info@clinicabelleza.com</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <MessageCircle className="h-6 w-6 text-rose-600 mr-4 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">WhatsApp</h3>
                    <p className="text-gray-600">+34 123 456 789</p>
                    <a 
                      href="https://wa.me/34123456789" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-rose-600 hover:underline text-sm"
                    >
                      Enviar mensaje
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <Clock className="h-6 w-6 text-rose-600 mr-4 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Horarios</h3>
                    <div className="text-gray-600 space-y-1">
                      <p>Lunes - Viernes: 9:00 - 20:00</p>
                      <p>Sábado: 9:00 - 18:00</p>
                      <p>Domingo: Cerrado</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-rose-50 rounded-lg">
                <h3 className="font-semibold text-rose-900 mb-2">
                  ¿Necesitas ayuda inmediata?
                </h3>
                <p className="text-rose-800 mb-4">
                  Nuestro asistente virtual está disponible 24/7 para ayudarte con 
                  reservas, consultas y información sobre servicios.
                </p>
                <button className="bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors">
                  Iniciar Chat
                </button>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Envíanos un Mensaje
              </h2>
              
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      placeholder="Tu nombre"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      placeholder="+34 123 456 789"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    placeholder="tu@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Asunto
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent">
                    <option value="">Selecciona un asunto</option>
                    <option value="consulta">Consulta general</option>
                    <option value="reserva">Reserva de cita</option>
                    <option value="productos">Información sobre productos</option>
                    <option value="reclamo">Reclamo o sugerencia</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje *
                  </label>
                  <textarea
                    required
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    placeholder="Escribe tu mensaje aquí..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="privacy"
                    required
                    className="h-4 w-4 text-rose-600 focus:ring-rose-500 border-gray-300 rounded"
                  />
                  <label htmlFor="privacy" className="ml-2 text-sm text-gray-600">
                    Acepto la{' '}
                    <a href="/privacidad" className="text-rose-600 hover:underline">
                      política de privacidad
                    </a>{' '}
                    y el tratamiento de mis datos personales.
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-rose-600 text-white py-3 px-6 rounded-lg hover:bg-rose-700 transition-colors font-medium"
                >
                  Enviar Mensaje
                </button>
              </form>
            </div>
          </div>

          {/* Map Section */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Nuestra Ubicación
            </h2>
            <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
              <p className="text-gray-600">
                Mapa interactivo - Calle Belleza 123, Madrid
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ContactPage;
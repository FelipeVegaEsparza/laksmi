'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import BannerCarousel from '@/components/BannerCarousel';
import FeaturedImages from '@/components/FeaturedImages';
import { Service } from '@/types';
import { servicesApi } from '@/services/api';
import { Clock, ArrowRight, Sparkles, Heart, Shield } from 'lucide-react';

export default function Home() {
  const [featuredServices, setFeaturedServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeaturedServices = async () => {
      try {
        const services = await servicesApi.getAll();
        // Get first 3 services as featured
        setFeaturedServices(services.slice(0, 3));
      } catch (error) {
        console.error('Error loading services:', error);
        // Mock data for development
        setFeaturedServices([
          {
            id: '1',
            name: 'Limpieza Facial Profunda',
            category: 'facial',
            price: 65,
            duration: 60,
            description: 'Tratamiento completo de limpieza facial con extracción de impurezas y hidratación profunda.',
            images: ['/images/facial-cleaning.jpg'],
            requirements: [],
            isActive: true
          },
          {
            id: '2',
            name: 'Masaje Relajante',
            category: 'corporal',
            price: 80,
            duration: 90,
            description: 'Masaje corporal completo para liberar tensiones y mejorar la circulación.',
            images: ['/images/massage.jpg'],
            requirements: [],
            isActive: true
          },
          {
            id: '3',
            name: 'Tratamiento Anti-edad',
            category: 'facial',
            price: 120,
            duration: 75,
            description: 'Tratamiento avanzado con tecnología de radiofrecuencia para combatir los signos del envejecimiento.',
            images: ['/images/anti-aging.jpg'],
            requirements: [],
            isActive: true
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedServices();
  }, []);

  return (
    <Layout>
      {/* Banner Carousel */}
      <BannerCarousel />

      {/* Featured Images */}
      <FeaturedImages />

      {/* Featured Services */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Servicios Destacados
            </h2>
            <p className="text-xl text-gray-600">
              Descubre nuestros tratamientos más populares
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-300"></div>
                  <div className="p-6">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-2/3 mb-4"></div>
                    <div className="h-3 bg-gray-300 rounded mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded mb-4"></div>
                    <div className="h-8 bg-gray-300 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredServices.map((service) => (
                <div key={service.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
                  <div className="h-48 bg-gradient-to-br from-rose-200 to-pink-300 flex items-center justify-center">
                    <Sparkles className="h-16 w-16 text-rose-600" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {service.name}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {service.description}
                    </p>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {service.duration} min
                      </div>
                      <div className="text-2xl font-bold text-rose-600">
                        €{service.price}
                      </div>
                    </div>
                    <Link
                      href={`/servicios/${service.id}`}
                      className="w-full bg-rose-600 text-white py-2 px-4 rounded-lg hover:bg-rose-700 transition-colors duration-200 font-medium flex items-center justify-center"
                    >
                      Ver Detalles
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              href="/servicios"
              className="inline-flex items-center bg-rose-600 text-white px-8 py-3 rounded-full hover:bg-rose-700 transition-colors duration-200 font-semibold"
            >
              Ver Todos los Servicios
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-rose-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            ¿Lista para tu transformación?
          </h2>
          <p className="text-xl text-rose-100 mb-8 max-w-2xl mx-auto">
            Reserva tu cita online las 24 horas o chatea con nosotros para 
            recibir asesoramiento personalizado.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/reservar"
              className="bg-white text-rose-600 px-8 py-4 rounded-full hover:bg-gray-100 transition-colors duration-200 font-semibold"
            >
              Reservar Cita Online
            </Link>
            <button className="border-2 border-white text-white px-8 py-4 rounded-full hover:bg-white hover:text-rose-600 transition-colors duration-200 font-semibold">
              Chatear con Nosotros
            </button>
          </div>
        </div>
      </section>
    </Layout>
  );
}

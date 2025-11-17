'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import BannerCarousel from '@/components/BannerCarousel';
import FeaturedImages from '@/components/FeaturedImages';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Loading from '@/components/Loading';
import { Service } from '@/types';
import { servicesApi } from '@/services/api';
import { Clock, ArrowRight, Sparkles } from 'lucide-react';
import { themeColors, hoverEffects } from '@/utils/colors';
import { formatPrice } from '@/utils/currency';
import ServiceImage from '@/components/ServiceImage';

export default function Home() {
  const [featuredServices, setFeaturedServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeaturedServices = async () => {
      try {
        const services = await servicesApi.getAll();
        // Get last 8 services (most recent)
        const recentServices = services.slice(-8).reverse();
        setFeaturedServices(recentServices);
      } catch (error) {
        console.error('Error loading services:', error);
        setFeaturedServices([]);
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Loading type="skeleton" className="h-48 mb-4" />
                  <Loading type="skeleton" className="h-4 mb-2" />
                  <Loading type="skeleton" className="h-4 w-2/3 mb-4" />
                  <Loading type="skeleton" className="h-3 mb-2" />
                  <Loading type="skeleton" className="h-3 mb-4" />
                  <Loading type="skeleton" className="h-8" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredServices.map((service) => (
                <Card key={service.id} hover className="overflow-hidden" padding="none">
                  <div className="relative w-full aspect-square overflow-hidden bg-gray-50 flex items-center justify-center p-2">
                    <ServiceImage
                      src={service.images?.[0] || ''}
                      alt={service.name}
                      className="max-w-full max-h-full object-contain"
                      fallbackClassName="w-full h-full"
                    />
                    {/* Service Tag Badge */}
                    {service.tag && (
                      <div className="absolute top-3 right-3">
                        <div 
                          className="text-white px-3 py-1 rounded-full shadow-lg backdrop-blur-sm bg-opacity-95 font-semibold text-xs tracking-wide uppercase"
                          style={{ background: themeColors.gradientPrimary }}
                        >
                          {service.tag}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3rem]">
                      {service.name}
                    </h3>
                    {/* Sessions Info */}
                    {service.sessions && service.sessions > 1 && (
                      <p className="text-gray-600 text-xs mb-2 flex items-center">
                        <Sparkles className="h-3 w-3 mr-1" style={{ color: themeColors.primary }} />
                        Incluye: <span className="font-semibold ml-1">{service.sessions} sesiones</span>
                      </p>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <div 
                        className="text-xl font-bold"
                        style={{ color: themeColors.primary }}
                      >
                        {formatPrice(service.price)}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {service.duration} min
                      </div>
                    </div>
                    <Button
                      href={`/servicios/${service.id}`}
                      variant="primary"
                      size="sm"
                      fullWidth
                      className="flex items-center justify-center"
                    >
                      Ver Detalles
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button
              href="/servicios"
              variant="primary"
              size="lg"
              className="rounded-full px-8 py-4 inline-flex items-center"
            >
              Ver Todos los Servicios
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        className="py-16"
        style={{ background: themeColors.gradientHero }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            ¿Lista para tu transformación?
          </h2>
          <p 
            className="text-xl mb-8 max-w-2xl mx-auto"
            style={{ color: 'rgba(255, 255, 255, 0.9)' }}
          >
            Reserva tu cita online las 24 horas o chatea con nosotros para 
            recibir asesoramiento personalizado.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              href="/reservar"
              variant="outline"
              size="lg"
              className="rounded-full px-8 py-4 bg-white border-white text-current hover:bg-opacity-90"
              style={{ color: themeColors.primary }}
            >
              Reservar Cita Online
            </Button>
            <button 
              className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold transition-all duration-300"
              {...hoverEffects.whiteButton}
              style={{ borderColor: 'white', color: 'white' }}
            >
              Chatear con Nosotros
            </button>
          </div>
        </div>
      </section>
    </Layout>
  );
}

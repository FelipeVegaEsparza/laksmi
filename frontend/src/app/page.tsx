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
import { getPlainTextPreview } from '@/utils/text';
import ServiceImage from '@/components/ServiceImage';
import { useCompanySettings } from '@/hooks/useCompanySettings';

export default function Home() {
  const [featuredServices, setFeaturedServices] = useState<Service[]>([]);
  const [highlightedService, setHighlightedService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const {contactWhatsapp} = useCompanySettings();

  useEffect(() => {
    const loadFeaturedServices = async () => {
      try {
        const services = await servicesApi.getAll();
        
        // Find the highlighted service (is_featured = true)
        const highlighted = services.find(service => service.is_featured === true);
        setHighlightedService(highlighted || null);
        
        // Filter services that belong to "Ofertas" category
        const ofertasServices = services.filter(service => 
          service.categories?.some(cat => 
            cat.toLowerCase() === 'ofertas' || cat.toLowerCase() === 'oferta'
          )
        );
        // Get up to 8 services from Ofertas category
        const featuredOfertas = ofertasServices.slice(0, 8);
        setFeaturedServices(featuredOfertas);
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

      {/* Highlighted Service Section */}
      {highlightedService && (
        <section className="py-16" style={{ backgroundColor: `${themeColors.primary}08` }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                {/* Image Side */}
                <div className="relative h-64 lg:h-auto min-h-[400px]">
                  <div className="absolute top-4 left-4 z-10">
                    <div 
                      className="text-white px-4 py-2 rounded-full shadow-lg backdrop-blur-sm bg-opacity-95 font-bold text-sm flex items-center gap-2"
                      style={{ background: themeColors.gradientPrimary }}
                    >
                      <Sparkles className="h-4 w-4" />
                      SERVICIO DESTACADO
                    </div>
                  </div>
                  {highlightedService.tag && (
                    <div className="absolute top-4 right-4 z-10">
                      <div 
                        className="text-white px-4 py-2 rounded-full shadow-lg backdrop-blur-sm bg-opacity-95 font-semibold text-sm tracking-wide uppercase"
                        style={{ background: themeColors.gradientPrimary }}
                      >
                        {highlightedService.tag}
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20"></div>
                  <ServiceImage
                    src={highlightedService.images?.[0] || ''}
                    alt={highlightedService.name}
                    className="w-full h-full object-cover"
                    fallbackClassName="w-full h-full"
                  />
                </div>

                {/* Content Side */}
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                    {highlightedService.name}
                  </h2>
                  
                  {highlightedService.sessions && highlightedService.sessions > 1 && (
                    <div className="flex items-center gap-2 mb-4">
                      <div 
                        className="text-white px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2"
                        style={{ backgroundColor: themeColors.primary }}
                      >
                        <Sparkles className="h-4 w-4" />
                        Incluye {highlightedService.sessions} Sesiones
                      </div>
                    </div>
                  )}

                  <div className="prose prose-lg max-w-none mb-6">
                    <p className="text-gray-600 text-lg leading-relaxed">
                      {getPlainTextPreview(highlightedService.description || '', 200)}
                    </p>
                  </div>

                  {/* Benefits */}
                  {highlightedService.benefits && (() => {
                    try {
                      const benefitsList = typeof highlightedService.benefits === 'string' 
                        ? JSON.parse(highlightedService.benefits) 
                        : highlightedService.benefits;
                      
                      if (Array.isArray(benefitsList) && benefitsList.length > 0) {
                        return (
                          <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Beneficios:</h3>
                            <ul className="space-y-2">
                              {benefitsList.slice(0, 4).map((benefit: string, index: number) => (
                                <li key={index} className="flex items-start">
                                  <svg 
                                    className="h-6 w-6 mr-2 flex-shrink-0 mt-0.5" 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                    style={{ color: themeColors.primary }}
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span className="text-gray-700">{benefit}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      }
                    } catch (e) {
                      console.error('Error parsing benefits:', e);
                    }
                    return null;
                  })()}

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Precio</div>
                      <div 
                        className="text-4xl font-bold"
                        style={{ color: themeColors.primary }}
                      >
                        {formatPrice(highlightedService.price)}
                      </div>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-5 w-5 mr-2" />
                      <span className="text-lg">{highlightedService.duration} minutos</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      href={`/servicios/${highlightedService.id}`}
                      variant="primary"
                      size="lg"
                      className="flex-1 rounded-full px-8 py-4 text-lg font-semibold"
                    >
                      Reservar Ahora
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                    <Button
                      href={`/servicios/${highlightedService.id}`}
                      variant="outline"
                      size="lg"
                      className="rounded-full px-8 py-4 text-lg font-semibold"
                    >
                      Ver Detalles
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Services */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Ofertas Especiales
            </h2>
            <p className="text-xl text-gray-600">
              Aprovecha nuestras promociones y paquetes exclusivos
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
                    {/* Sessions Badge */}
                    {service.sessions && service.sessions > 1 && (
                      <div className="absolute top-3 left-3">
                        <div 
                          className="text-white px-3 py-1 rounded-full shadow-lg backdrop-blur-sm bg-opacity-95 font-semibold text-xs flex items-center gap-1"
                          style={{ background: themeColors.gradientPrimary }}
                        >
                          <Sparkles className="h-3 w-3" />
                          {service.sessions} Sesiones
                        </div>
                      </div>
                    )}
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
            <a
              href={contactWhatsapp 
                ? `https://wa.me/${contactWhatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hola, me gustaría recibir más información sobre sus servicios')}`
                : '#'
              }
              onClick={(e) => {
                if (!contactWhatsapp) {
                  e.preventDefault();
                  alert('El número de WhatsApp no está configurado. Por favor, contacta al administrador.');
                }
              }}
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold transition-all duration-300 inline-block"
              {...hoverEffects.whiteButton}
              style={{ borderColor: 'white', color: 'white' }}
            >
              Chatear con Nosotros
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
}

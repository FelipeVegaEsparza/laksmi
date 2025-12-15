'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import BannerCarousel from '@/components/BannerCarousel';
import FeaturedImages from '@/components/FeaturedImages';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Loading from '@/components/Loading';
import { Service, Product } from '@/types';
import { servicesApi, productsApi } from '@/services/api';
import { Clock, ArrowRight, Sparkles, ShoppingCart } from 'lucide-react';
import { themeColors, hoverEffects } from '@/utils/colors';
import { formatPrice } from '@/utils/currency';
import { getPlainTextPreview } from '@/utils/text';
import ServiceImage from '@/components/ServiceImage';
import { useCompanySettings } from '@/hooks/useCompanySettings';

export default function Home() {
  const [featuredServices, setFeaturedServices] = useState<Service[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [highlightedServices, setHighlightedServices] = useState<Service[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const {contactWhatsapp} = useCompanySettings();

  useEffect(() => {
    const loadFeaturedServices = async () => {
      try {
        const services = await servicesApi.getAll();
        
        // Find all highlighted services (is_featured = true)
        const highlighted = services.filter(service => service.is_featured === true);
        setHighlightedServices(highlighted);
        
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

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      try {
        const products = await productsApi.getAll();
        
        // Filter products that belong to "Ofertas" category
        const ofertasProducts = products.filter(product => 
          product.categories?.some(cat => 
            cat.toLowerCase() === 'ofertas' || cat.toLowerCase() === 'oferta'
          )
        );
        // Get up to 8 products from Ofertas category
        const featuredOfertas = ofertasProducts.slice(0, 8);
        setFeaturedProducts(featuredOfertas);
      } catch (error) {
        console.error('Error loading products:', error);
        setFeaturedProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    loadFeaturedProducts();
  }, []);

  // Auto-advance slider every 5 seconds
  useEffect(() => {
    if (highlightedServices.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % highlightedServices.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [highlightedServices.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % highlightedServices.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + highlightedServices.length) % highlightedServices.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <Layout>
      {/* Banner Carousel */}
      <BannerCarousel />

      {/* Featured Images */}
      <FeaturedImages />

      {/* Highlighted Services Slider */}
      {highlightedServices.length > 0 && (
        <section className="py-16" style={{ backgroundColor: `${themeColors.primary}08` }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden relative">
              {/* Slider Container */}
              <div className="relative">
                {highlightedServices.map((service, index) => (
                  <div
                    key={service.id}
                    className={`transition-opacity duration-500 ${
                      index === currentSlide ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'
                    }`}
                  >
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
                        {service.tag && (
                          <div className="absolute top-4 right-4 z-10">
                            <div 
                              className="text-white px-4 py-2 rounded-full shadow-lg backdrop-blur-sm bg-opacity-95 font-semibold text-sm tracking-wide uppercase"
                              style={{ background: themeColors.gradientPrimary }}
                            >
                              {service.tag}
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20"></div>
                        <ServiceImage
                          src={service.images?.[0] || ''}
                          alt={service.name}
                          className="w-full h-full object-cover"
                          fallbackClassName="w-full h-full"
                        />
                      </div>

                      {/* Content Side */}
                      <div className="p-8 lg:p-12 flex flex-col justify-center">
                        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                          {service.name}
                        </h2>
                        
                        {service.sessions && service.sessions > 1 && (
                          <div className="flex items-center gap-2 mb-4">
                            <div 
                              className="text-white px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2"
                              style={{ backgroundColor: themeColors.primary }}
                            >
                              <Sparkles className="h-4 w-4" />
                              Incluye {service.sessions} Sesiones
                            </div>
                          </div>
                        )}

                        <div className="prose prose-lg max-w-none mb-6">
                          <p className="text-gray-600 text-lg leading-relaxed">
                            {getPlainTextPreview(service.description || '', 200)}
                          </p>
                        </div>

                        {/* Benefits */}
                        {service.benefits && (() => {
                          try {
                            const benefitsList = typeof service.benefits === 'string' 
                              ? JSON.parse(service.benefits) 
                              : service.benefits;
                            
                            if (Array.isArray(benefitsList) && benefitsList.length > 0) {
                              return (
                                <div className="mb-6">
                                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Beneficios:</h3>
                                  <ul className="space-y-2">
                                    {benefitsList.slice(0, 4).map((benefit: string, idx: number) => (
                                      <li key={idx} className="flex items-start">
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
                              {formatPrice(service.price)}
                            </div>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Clock className="h-5 w-5 mr-2" />
                            <span className="text-lg">{service.duration} minutos</span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button
                            href={`/servicios/${service.id}`}
                            variant="primary"
                            size="lg"
                            className="flex-1 rounded-full px-8 py-4 text-lg font-semibold"
                          >
                            Reservar Ahora
                            <ArrowRight className="h-5 w-5 ml-2" />
                          </Button>
                          <Button
                            href={`/servicios/${service.id}`}
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
                ))}
              </div>

              {/* Navigation Arrows - Only show if more than 1 service */}
              {highlightedServices.length > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all duration-200"
                    style={{ color: themeColors.primary }}
                    aria-label="Anterior"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all duration-200"
                    style={{ color: themeColors.primary }}
                    aria-label="Siguiente"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Dots Indicator */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                    {highlightedServices.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          index === currentSlide 
                            ? 'w-8' 
                            : 'hover:opacity-80'
                        }`}
                        style={{ 
                          backgroundColor: index === currentSlide ? themeColors.primary : 'rgba(255,255,255,0.5)'
                        }}
                        aria-label={`Ir a servicio ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
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

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Productos en Oferta
              </h2>
              <p className="text-xl text-gray-600">
                Descubre nuestros productos de belleza con precios especiales
              </p>
            </div>

            {loadingProducts ? (
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
                {featuredProducts.map((product) => (
                  <Card key={product.id} hover className="overflow-hidden flex flex-col" padding="none">
                    <div className="relative w-full aspect-square overflow-hidden bg-gray-50 flex items-center justify-center p-2">
                      <ServiceImage
                        src={product.images?.[0] || ''}
                        alt={product.name}
                        className="max-w-full max-h-full object-contain"
                        fallbackClassName="w-full h-full"
                      />
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex flex-wrap gap-1">
                          {product.categories && product.categories.length > 0 ? (
                            product.categories.map((cat, index) => (
                              <span 
                                key={index}
                                className="text-xs font-medium px-2 py-1 rounded-full"
                                style={{ 
                                  color: index === 0 ? 'white' : themeColors.primary,
                                  backgroundColor: index === 0 ? themeColors.primary : themeColors.primaryLight,
                                  fontWeight: index === 0 ? 600 : 500
                                }}
                              >
                                {cat}
                              </span>
                            ))
                          ) : (
                            <span 
                              className="text-xs font-medium px-2 py-1 rounded-full"
                              style={{ 
                                color: themeColors.primary,
                                backgroundColor: themeColors.primaryLight 
                              }}
                            >
                              {product.category}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 ml-2">
                          Stock: {product.stock}
                        </div>
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3rem]">
                        {product.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2 flex-grow">
                        {product.description}
                      </p>
                      <div 
                        className="text-xl font-bold mb-3"
                        style={{ color: themeColors.primary }}
                      >
                        {formatPrice(product.price)}
                      </div>
                      <Button
                        href={`/productos/${product.id}`}
                        variant="primary"
                        size="sm"
                        fullWidth
                        className="flex items-center justify-center"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Ver Producto
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <div className="text-center mt-12">
              <Button
                href="/productos"
                variant="primary"
                size="lg"
                className="rounded-full px-8 py-4 inline-flex items-center"
              >
                Ver Todos los Productos
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
        </section>
      )}

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

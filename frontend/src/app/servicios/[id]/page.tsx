'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Loading from '@/components/Loading';
import { Service } from '@/types';
import { servicesApi } from '@/services/api';
import { Clock, ArrowLeft, Calendar, Sparkles, CheckCircle, AlertCircle, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import ServiceImage from '@/components/ServiceImage';
import { formatPrice } from '@/utils/currency';
import { themeColors, dynamicStyles, hoverEffects } from '@/utils/colors';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useChatContext } from '@/contexts/ChatContext';

const ServiceDetailPage = () => {
  const params = useParams();
  const [service, setService] = useState<Service | null>(null);
  const [relatedServices, setRelatedServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { contactPhone } = useCompanySettings();
  const { setServiceContext } = useChatContext();

  useEffect(() => {
    const loadService = async () => {
      try {
        if (params.id) {
          const serviceData = await servicesApi.getById(params.id as string);
          console.log('Service data received:', serviceData);
          console.log('Service images:', serviceData.images);
          setService(serviceData);
          
          // Set service context for chat widget
          setServiceContext({
            id: serviceData.id,
            name: serviceData.name
          });
          
          // Cargar servicios relacionados (misma categoría o aleatorios)
          try {
            const allServices = await servicesApi.getAll();
            // Filtrar el servicio actual
            const otherServices = allServices.filter(s => s.id !== params.id);
            
            // Intentar obtener servicios que comparten alguna categoría
            let related = otherServices.filter(s => {
              // Check if service has categories array
              if (serviceData.categories && serviceData.categories.length > 0) {
                if (s.categories && s.categories.length > 0) {
                  // Check if any category matches
                  return s.categories.some(cat => serviceData.categories!.includes(cat));
                }
                // Fallback to primary category
                return serviceData.categories.includes(s.category);
              }
              // Fallback to primary category comparison
              return s.category === serviceData.category;
            });
            
            // Si no hay suficientes de la misma categoría, agregar otros aleatorios
            if (related.length < 3) {
              const remaining = otherServices.filter(s => !related.includes(s));
              related = [...related, ...remaining];
            }
            
            // Mezclar aleatoriamente y tomar solo 3
            const shuffled = related.sort(() => Math.random() - 0.5);
            setRelatedServices(shuffled.slice(0, 3));
          } catch (error) {
            console.error('Error loading related services:', error);
          }
        }
      } catch (error) {
        console.error('Error loading service:', error);
        setService(null);
      } finally {
        setLoading(false);
      }
    };

    loadService();
    
    // Cleanup: clear service context when leaving the page
    return () => {
      setServiceContext(null);
    };
  }, [params.id, setServiceContext]);

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Loading type="skeleton" className="h-8 w-1/4 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Loading type="skeleton" className="h-96 rounded-lg" />
            <div className="space-y-4">
              <Loading type="skeleton" className="h-8 w-3/4" />
              <Loading type="skeleton" className="h-4 w-1/2" />
              <Loading type="skeleton" className="h-20" />
              <Loading type="skeleton" className="h-12" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!service) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Servicio no encontrado
            </h2>
            <p className="text-gray-600 mb-8">
              El servicio que buscas no existe o ha sido eliminado.
            </p>
            <Button
              href="/servicios"
              variant="primary"
              size="lg"
            >
              Ver Todos los Servicios
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const categoryNames: { [key: string]: string } = {
    facial: 'Tratamientos Faciales',
    corporal: 'Tratamientos Corporales',
    spa: 'Spa y Relajación',
    estetica: 'Estética Avanzada'
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
          <Link 
            href="/" 
            className="transition-colors duration-300"
            onMouseEnter={(e) => e.currentTarget.style.color = themeColors.primary}
            onMouseLeave={(e) => e.currentTarget.style.color = ''}
          >
            Inicio
          </Link>
          <span>/</span>
          <Link 
            href="/servicios" 
            className="transition-colors duration-300"
            onMouseEnter={(e) => e.currentTarget.style.color = themeColors.primary}
            onMouseLeave={(e) => e.currentTarget.style.color = ''}
          >
            Servicios
          </Link>
          <span>/</span>
          <span className="text-gray-900">{service.name}</span>
        </nav>

        {/* Back Button */}
        <Link
          href="/servicios"
          className="inline-flex items-center mb-6 transition-colors duration-300"
          style={{ color: themeColors.primary }}
          onMouseEnter={(e) => e.currentTarget.style.color = themeColors.primaryHover}
          onMouseLeave={(e) => e.currentTarget.style.color = themeColors.primary}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Servicios
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Service Image */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-lg overflow-hidden">
              <ServiceImage
                src={service.images?.[selectedImageIndex] || ''}
                alt={service.name}
                className="w-full h-full object-cover"
                fallbackClassName="w-full h-full"
              />
              {/* Sessions Badge */}
              {service.sessions && service.sessions > 1 && (
                <div className="absolute top-4 left-4">
                  <div 
                    className="text-white px-4 py-2 rounded-full shadow-lg backdrop-blur-sm bg-opacity-95 font-semibold text-sm flex items-center gap-2"
                    style={{ background: themeColors.gradientPrimary }}
                  >
                    <Sparkles className="h-4 w-4" />
                    {service.sessions} Sesiones
                  </div>
                </div>
              )}
              {/* Service Tag Badge */}
              {service.tag && (
                <div className="absolute top-4 right-4">
                  <div 
                    className="text-white px-4 py-2 rounded-full shadow-lg backdrop-blur-sm bg-opacity-95 font-semibold text-sm tracking-wide uppercase"
                    style={{ background: themeColors.gradientPrimary }}
                  >
                    {service.tag}
                  </div>
                </div>
              )}
            </div>
            {service.images && service.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {service.images.map((image, index) => (
                  <div 
                    key={index} 
                    className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all duration-300 ${
                      selectedImageIndex === index 
                        ? 'ring-2 ring-offset-2 opacity-100' 
                        : 'hover:opacity-80 opacity-70'
                    }`}
                    style={selectedImageIndex === index ? { 
                      borderColor: themeColors.primary,
                      boxShadow: `0 0 0 2px ${themeColors.primary}`
                    } : {}}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <ServiceImage
                      src={image}
                      alt={`${service.name} - imagen ${index + 1}`}
                      className="w-full h-full object-cover"
                      fallbackClassName="w-full h-full"
                    />
                  </div>
                ))}
              </div>
            )}
            
            {/* Additional Info - Moved here for large screens */}
            <Card 
              className="hidden lg:block"
              style={{ backgroundColor: themeColors.primaryLight }}
            >
              <h3 className="font-semibold text-white mb-2">
                ¿Tienes dudas sobre este tratamiento?
              </h3>
              <p className="text-white mb-4">
                Nuestro equipo de profesionales está disponible para resolver 
                todas tus consultas y ayudarte a elegir el mejor tratamiento.
              </p>
              <Button 
                variant="primary" 
                size="sm"
                className="w-full flex items-center justify-center gap-2"
                onClick={() => {
                  const phone = contactPhone?.replace(/\D/g, '') || '';
                  const message = encodeURIComponent(`Hola, quiero información sobre ${service.name}`);
                  window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
                }}
              >
                <MessageCircle className="h-4 w-4" />
                Hablemos por WhatsApp
              </Button>
            </Card>
          </div>

          {/* Service Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {service.categories && service.categories.length > 0 ? (
                  service.categories.map((cat, index) => (
                    <Link
                      key={index}
                      href={`/servicios?category=${cat}`}
                      className="text-sm font-medium px-3 py-1 rounded-full transition-all duration-300 hover:shadow-md"
                      style={{ 
                        color: index === 0 ? 'white' : themeColors.primary,
                        backgroundColor: index === 0 ? themeColors.primary : themeColors.primaryLight,
                        fontWeight: index === 0 ? 600 : 500
                      }}
                      title={index === 0 ? 'Categoría principal - Click para ver más servicios' : 'Click para ver más servicios'}
                      onMouseEnter={(e) => {
                        if (index === 0) {
                          e.currentTarget.style.backgroundColor = themeColors.primaryHover;
                        } else {
                          e.currentTarget.style.backgroundColor = themeColors.primary;
                          e.currentTarget.style.color = 'white';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (index === 0) {
                          e.currentTarget.style.backgroundColor = themeColors.primary;
                        } else {
                          e.currentTarget.style.backgroundColor = themeColors.primaryLight;
                          e.currentTarget.style.color = themeColors.primary;
                        }
                      }}
                    >
                      {categoryNames[cat] || cat}
                    </Link>
                  ))
                ) : (
                  <Link
                    href={`/servicios?category=${service.category}`}
                    className="text-sm font-medium px-3 py-1 rounded-full transition-all duration-300 hover:shadow-md"
                    style={{ 
                      color: themeColors.primary,
                      backgroundColor: themeColors.primaryLight 
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = themeColors.primary;
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = themeColors.primaryLight;
                      e.currentTarget.style.color = themeColors.primary;
                    }}
                  >
                    {categoryNames[service.category] || service.category}
                  </Link>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {service.name}
              </h1>
              {/* Sessions Info */}
              {service.sessions && service.sessions > 1 && (
                <p className="text-gray-600 mb-4 flex items-center">
                  <Sparkles className="h-4 w-4 mr-2" style={{ color: themeColors.primary }} />
                  Este servicio incluye: <span className="font-semibold ml-1">{service.sessions} sesiones</span>
                </p>
              )}
              <div className="flex items-center gap-6 text-lg">
                <div className="flex items-center text-gray-600">
                  <Clock className="h-5 w-5 mr-2" />
                  {service.duration} minutos
                </div>
                <div 
                  className="text-3xl font-bold"
                  style={{ color: themeColors.primary }}
                >
                  {formatPrice(service.price)}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Descripción del Tratamiento
              </h2>
              <div 
                className="prose prose-sm max-w-none text-justify"
                dangerouslySetInnerHTML={{ __html: service.description }}
              />
            </div>

            {service.requirements && service.requirements.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Requisitos y Recomendaciones
                </h2>
                <ul className="space-y-2">
                  {service.requirements.map((requirement, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" style={{ color: themeColors.primary }} />
                      <span className="text-gray-600 text-justify">{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Benefits */}
            {service.benefits && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Beneficios del Tratamiento
                </h2>
                <div 
                  className="prose prose-sm max-w-none text-justify"
                  dangerouslySetInnerHTML={{ __html: service.benefits }}
                />
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button
                href={`/reservar?service=${service.id}`}
                variant="primary"
                size="lg"
                className="flex-1 flex items-center justify-center"
              >
                <Calendar className="h-5 w-5 mr-2" />
                Reservar Cita
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="flex-1"
                onClick={() => {
                  const phone = contactPhone?.replace(/\D/g, '') || '';
                  const message = encodeURIComponent(`Hola, quiero información sobre ${service.name}`);
                  window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
                }}
              >
                Consultar por WhatsApp
              </Button>
            </div>

            {/* Additional Info - Visible only on mobile/tablet */}
            <Card 
              className="lg:hidden"
              style={{ backgroundColor: themeColors.primaryLight }}
            >
              <h3 className="font-semibold text-white mb-2">
                ¿Tienes dudas sobre este tratamiento?
              </h3>
              <p className="text-white mb-4">
                Nuestro equipo de profesionales está disponible para resolver 
                todas tus consultas y ayudarte a elegir el mejor tratamiento.
              </p>
              <Button 
                variant="primary" 
                size="sm"
                className="w-full flex items-center justify-center gap-2"
                onClick={() => {
                  const phone = contactPhone?.replace(/\D/g, '') || '';
                  const message = encodeURIComponent(`Hola, quiero información sobre ${service.name}`);
                  window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
                }}
              >
                <MessageCircle className="h-4 w-4" />
                Hablemos por WhatsApp
              </Button>
            </Card>
          </div>
        </div>

        {/* Related Services */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Servicios Relacionados
          </h2>
          {relatedServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedServices.map((relatedService) => (
                <Card key={relatedService.id} hover className="overflow-hidden">
                  <div className="relative h-48 overflow-hidden -m-6 mb-6">
                    {relatedService.images && relatedService.images.length > 0 ? (
                      <ServiceImage
                        src={relatedService.images[0]}
                        alt={relatedService.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: themeColors.gradientLight }}
                      >
                        <Sparkles className="h-16 w-16" style={{ color: themeColors.primary }} />
                      </div>
                    )}
                    {relatedService.tag && (
                      <div 
                        className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: themeColors.primary }}
                      >
                        {relatedService.tag}
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {relatedService.name}
                  </h3>
                  <div 
                    className="text-gray-600 mb-4 line-clamp-2 prose prose-sm max-w-none text-justify"
                    dangerouslySetInnerHTML={{ __html: relatedService.description }}
                  />
                  <div className="flex items-center justify-between">
                    <span 
                      className="text-xl font-bold"
                      style={{ color: themeColors.primary }}
                    >
                      {formatPrice(relatedService.price)}
                    </span>
                    <Button
                      href={`/servicios/${relatedService.id}`}
                      variant="primary"
                      size="sm"
                    >
                      Ver Detalles
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No hay servicios relacionados disponibles</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ServiceDetailPage;
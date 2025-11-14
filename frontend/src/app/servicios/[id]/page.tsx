'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Loading from '@/components/Loading';
import { Service } from '@/types';
import { servicesApi } from '@/services/api';
import { Clock, ArrowLeft, Calendar, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import ServiceImage from '@/components/ServiceImage';
import { formatPrice } from '@/utils/currency';
import { themeColors, dynamicStyles, hoverEffects } from '@/utils/colors';

const ServiceDetailPage = () => {
  const params = useParams();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadService = async () => {
      try {
        if (params.id) {
          const serviceData = await servicesApi.getById(params.id as string);
          console.log('Service data received:', serviceData);
          console.log('Service images:', serviceData.images);
          setService(serviceData);
        }
      } catch (error) {
        console.error('Error loading service:', error);
        setService(null);
      } finally {
        setLoading(false);
      }
    };

    loadService();
  }, [params.id]);

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
                src={service.images?.[0] || ''}
                alt={service.name}
                className="w-full h-full object-cover"
                fallbackClassName="w-full h-full"
              />
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
                {service.images.slice(1).map((image, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                    <ServiceImage
                      src={image}
                      alt={`${service.name} - imagen ${index + 2}`}
                      className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
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
              <h3 className="font-semibold text-gray-900 mb-2">
                ¿Tienes dudas sobre este tratamiento?
              </h3>
              <p className="text-gray-600 mb-4">
                Nuestro equipo de profesionales está disponible para resolver 
                todas tus consultas y ayudarte a elegir el mejor tratamiento.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="primary" size="sm">
                  Chat en Vivo
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('tel:+34123456789')}
                >
                  Llamar Ahora
                </Button>
              </div>
            </Card>
          </div>

          {/* Service Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span 
                  className="text-sm font-medium px-3 py-1 rounded-full"
                  style={{ 
                    color: themeColors.primary,
                    backgroundColor: themeColors.primaryLight 
                  }}
                >
                  {categoryNames[service.category] || service.category}
                </span>
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
              <p className="text-gray-600 leading-relaxed">
                {service.description}
              </p>
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
                      <span className="text-gray-600">{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Benefits */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Beneficios del Tratamiento
              </h2>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" style={{ color: themeColors.primary }} />
                  <span className="text-gray-600">Mejora la textura y luminosidad de la piel</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" style={{ color: themeColors.primary }} />
                  <span className="text-gray-600">Limpieza profunda de poros</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" style={{ color: themeColors.primary }} />
                  <span className="text-gray-600">Hidratación y nutrición de la piel</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" style={{ color: themeColors.primary }} />
                  <span className="text-gray-600">Relajación y bienestar</span>
                </li>
              </ul>
            </div>

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
              >
                Consultar por WhatsApp
              </Button>
            </div>

            {/* Additional Info - Visible only on mobile/tablet */}
            <Card 
              className="lg:hidden"
              style={{ backgroundColor: themeColors.primaryLight }}
            >
              <h3 className="font-semibold text-gray-900 mb-2">
                ¿Tienes dudas sobre este tratamiento?
              </h3>
              <p className="text-gray-600 mb-4">
                Nuestro equipo de profesionales está disponible para resolver 
                todas tus consultas y ayudarte a elegir el mejor tratamiento.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="primary" size="sm">
                  Chat en Vivo
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('tel:+34123456789')}
                >
                  Llamar Ahora
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Related Services */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Servicios Relacionados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Mock related services */}
            {[1, 2, 3].map((i) => (
              <Card key={i} hover className="overflow-hidden">
                <div 
                  className="relative h-48 overflow-hidden -m-6 mb-6"
                  style={{ background: themeColors.gradientLight }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="h-16 w-16" style={{ color: themeColors.primary }} />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Servicio Relacionado {i}
                </h3>
                <p className="text-gray-600 mb-4">
                  Descripción breve del servicio relacionado.
                </p>
                <div className="flex items-center justify-between">
                  <span 
                    className="text-xl font-bold"
                    style={{ color: themeColors.primary }}
                  >
                    {formatPrice(50 + i * 10)}
                  </span>
                  <Button
                    href={`/servicios/${i}`}
                    variant="primary"
                    size="sm"
                  >
                    Ver Detalles
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ServiceDetailPage;
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { Service } from '@/types';
import { servicesApi } from '@/services/api';
import { Clock, ArrowLeft, Calendar, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const ServiceDetailPage = () => {
  const params = useParams();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadService = async () => {
      try {
        if (params.id) {
          const serviceData = await servicesApi.getById(params.id as string);
          setService(serviceData);
        }
      } catch (error) {
        console.error('Error loading service:', error);
        // Mock data for development
        const mockService: Service = {
          id: params.id as string,
          name: 'Limpieza Facial Profunda',
          category: 'facial',
          price: 65,
          duration: 60,
          description: 'Tratamiento completo de limpieza facial con extracción de impurezas y hidratación profunda. Este tratamiento incluye análisis detallado de la piel, limpieza profunda, exfoliación suave, extracción de comedones, aplicación de mascarilla purificante y hidratación final. Ideal para todo tipo de pieles, especialmente pieles grasas y mixtas con tendencia acneica.',
          images: ['/images/facial-cleaning.jpg'],
          requirements: ['No usar productos exfoliantes 48h antes', 'Informar sobre alergias conocidas'],
          isActive: true
        };
        setService(mockService);
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
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-300 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                <div className="h-20 bg-gray-300 rounded"></div>
                <div className="h-12 bg-gray-300 rounded"></div>
              </div>
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
            <Link
              href="/servicios"
              className="bg-rose-600 text-white px-6 py-3 rounded-lg hover:bg-rose-700 transition-colors duration-200 font-medium"
            >
              Ver Todos los Servicios
            </Link>
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
          <Link href="/" className="hover:text-rose-600">Inicio</Link>
          <span>/</span>
          <Link href="/servicios" className="hover:text-rose-600">Servicios</Link>
          <span>/</span>
          <span className="text-gray-900">{service.name}</span>
        </nav>

        {/* Back Button */}
        <Link
          href="/servicios"
          className="inline-flex items-center text-rose-600 hover:text-rose-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Servicios
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Service Image */}
          <div className="space-y-4">
            <div className="aspect-square bg-gradient-to-br from-rose-200 to-pink-300 rounded-lg flex items-center justify-center">
              <Sparkles className="h-32 w-32 text-rose-600" />
            </div>
            {service.images && service.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {service.images.slice(1).map((image, index) => (
                  <div key={index} className="aspect-square bg-gradient-to-br from-rose-100 to-pink-200 rounded-lg flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-rose-500" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Service Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-medium text-rose-600 bg-rose-100 px-3 py-1 rounded-full">
                  {categoryNames[service.category] || service.category}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {service.name}
              </h1>
              <div className="flex items-center gap-6 text-lg">
                <div className="flex items-center text-gray-600">
                  <Clock className="h-5 w-5 mr-2" />
                  {service.duration} minutos
                </div>
                <div className="text-3xl font-bold text-rose-600">
                  €{service.price}
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
                      <CheckCircle className="h-5 w-5 text-rose-600 mr-2 mt-0.5 flex-shrink-0" />
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
                  <CheckCircle className="h-5 w-5 text-rose-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Mejora la textura y luminosidad de la piel</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-rose-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Limpieza profunda de poros</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-rose-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Hidratación y nutrición de la piel</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-rose-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Relajación y bienestar</span>
                </li>
              </ul>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Link
                href={`/reservar?service=${service.id}`}
                className="flex-1 bg-rose-600 text-white py-4 px-6 rounded-lg hover:bg-rose-700 transition-colors duration-200 font-semibold text-center flex items-center justify-center"
              >
                <Calendar className="h-5 w-5 mr-2" />
                Reservar Cita
              </Link>
              <button className="flex-1 border-2 border-rose-600 text-rose-600 py-4 px-6 rounded-lg hover:bg-rose-600 hover:text-white transition-colors duration-200 font-semibold">
                Consultar por WhatsApp
              </button>
            </div>

            {/* Additional Info */}
            <div className="bg-rose-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">
                ¿Tienes dudas sobre este tratamiento?
              </h3>
              <p className="text-gray-600 mb-4">
                Nuestro equipo de profesionales está disponible para resolver 
                todas tus consultas y ayudarte a elegir el mejor tratamiento.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button className="bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors duration-200 font-medium">
                  Chat en Vivo
                </button>
                <a
                  href="tel:+34123456789"
                  className="border border-rose-600 text-rose-600 px-4 py-2 rounded-lg hover:bg-rose-600 hover:text-white transition-colors duration-200 font-medium text-center"
                >
                  Llamar Ahora
                </a>
              </div>
            </div>
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
              <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                <div className="h-48 bg-gradient-to-br from-rose-200 to-pink-300 flex items-center justify-center">
                  <Sparkles className="h-16 w-16 text-rose-600" />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Servicio Relacionado {i}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Descripción breve del servicio relacionado.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-rose-600">€{50 + i * 10}</span>
                    <Link
                      href={`/servicios/${i}`}
                      className="bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors duration-200 font-medium"
                    >
                      Ver Detalles
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ServiceDetailPage;
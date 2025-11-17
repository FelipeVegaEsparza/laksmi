'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Loading from '@/components/Loading';
import { Service } from '@/types';
import { servicesApi } from '@/services/api';
import { Search, Filter, Clock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import ServiceImage from '@/components/ServiceImage';
import { formatPrice } from '@/utils/currency';
import { themeColors, dynamicStyles, hoverEffects } from '@/utils/colors';
import { getPlainTextPreview } from '@/utils/text';

const ServicesContent = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([
    { id: 'all', name: 'Todos los Servicios' }
  ]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');


  const searchParams = useSearchParams();

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await servicesApi.getCategories();
        setCategories([
          { id: 'all', name: 'Todos los Servicios' },
          ...categoriesData
        ]);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };

    const loadServices = async () => {
      try {
        console.log('🔄 Cargando servicios desde API...');
        const servicesData = await servicesApi.getAll();
        console.log('✅ Servicios cargados:', servicesData);
        console.log('📊 Total de servicios:', servicesData.length);
        setServices(servicesData);
        setFilteredServices(servicesData);
      } catch (error) {
        console.error('❌ Error loading services:', error);
        setServices([]);
        setFilteredServices([]);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
    loadServices();
  }, []);

  useEffect(() => {
    // Get category and search from URL params
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    
    if (category && category !== 'all') {
      setSelectedCategory(category);
    }
    
    if (search) {
      setSearchTerm(search);
    }
  }, [searchParams]);

  useEffect(() => {
    let filtered = services;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(service => service.category === selectedCategory);
    }

    setFilteredServices(filtered);
  }, [services, searchTerm, selectedCategory]);

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Nuestros Servicios
            </h1>
            <p className="text-xl text-gray-600">
              Descubre nuestra amplia gama de tratamientos de belleza y bienestar
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <div className="lg:w-1/4">
              <Card className="sticky top-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Filter className="h-5 w-5 mr-2" style={{ color: themeColors.primary }} />
                  Filtros
                </h3>

                {/* Search */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar servicios..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-300"
                      style={{
                        '--tw-ring-color': themeColors.primary,
                      } as React.CSSProperties}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = themeColors.primary;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '';
                      }}
                    />
                  </div>
                </div>

                {/* Categories */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría
                  </label>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <label key={category.id} className="flex items-center">
                        <input
                          type="radio"
                          name="category"
                          value={category.id}
                          checked={selectedCategory === category.id}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="h-4 w-4 border-gray-300 focus:ring-2"
                          style={{
                            color: themeColors.primary,
                            '--tw-ring-color': themeColors.primary,
                          } as React.CSSProperties}
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {category.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>


              </Card>
            </div>

            {/* Services Grid */}
            <div className="lg:w-3/4">
              <div className="flex justify-between items-center mb-6">
                <p className="text-gray-600">
                  {filteredServices.length} servicios encontrados
                </p>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="overflow-hidden">
                      <Loading type="skeleton" className="aspect-square mb-4" />
                      <Loading type="skeleton" className="h-4 mb-3" />
                      <Loading type="skeleton" className="h-4 w-2/3 mb-3" />
                      <Loading type="skeleton" className="h-3 mb-2" />
                      <Loading type="skeleton" className="h-3 mb-3" />
                      <Loading type="skeleton" className="h-8" />
                    </Card>
                  ))}
                </div>
              ) : filteredServices.length === 0 ? (
                <Card className="text-center py-12">
                  <Sparkles className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No se encontraron servicios
                  </h3>
                  <p className="text-gray-600">
                    Intenta ajustar los filtros para ver más resultados.
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredServices.map((service) => (
                    <Card key={service.id} hover className="overflow-hidden flex flex-col" padding="none">
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
                        <div className="flex items-start justify-between mb-2">
                          <span 
                            className="text-xs font-medium px-2 py-1 rounded-full"
                            style={{ 
                              color: themeColors.primary,
                              backgroundColor: themeColors.primaryLight 
                            }}
                          >
                            {categories.find(c => c.id === service.category)?.name || service.category}
                          </span>
                          <div 
                            className="text-xl font-bold"
                            style={{ color: themeColors.primary }}
                          >
                            {formatPrice(service.price)}
                          </div>
                        </div>
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
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2 flex-grow">
                          {getPlainTextPreview(service.description, 100)}
                        </p>
                        <div className="flex items-center text-sm text-gray-500 mb-3">
                          <Clock className="h-4 w-4 mr-1" />
                          {service.duration} min
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            href={`/servicios/${service.id}`}
                            variant="primary"
                            size="sm"
                            fullWidth
                          >
                            Ver Detalles
                          </Button>
                          <Button
                            href={`/reservar?service=${service.id}`}
                            variant="outline"
                            size="sm"
                            fullWidth
                          >
                            Reservar
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const ServicesPage = () => {
  return (
    <Suspense fallback={
      <Layout>
        <div className="bg-gray-50 min-h-screen">
          <div className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-300 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    }>
      <ServicesContent />
    </Suspense>
  );
};

export default ServicesPage;
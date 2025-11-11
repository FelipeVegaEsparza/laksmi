'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { Service } from '@/types';
import { servicesApi } from '@/services/api';
import { Search, Filter, Clock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import ServiceImage from '@/components/ServiceImage';
import { formatPrice } from '@/utils/currency';

const ServicesContent = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([
    { id: 'all', name: 'Todos los Servicios' }
  ]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);

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
        const servicesData = await servicesApi.getAll();
        setServices(servicesData);
        setFilteredServices(servicesData);
      } catch (error) {
        console.error('Error loading services:', error);
        // Mock data for development
        const mockServices: Service[] = [
          {
            id: '1',
            name: 'Limpieza Facial Profunda',
            category: 'facial',
            price: 65,
            duration: 60,
            description: 'Tratamiento completo de limpieza facial con extracción de impurezas y hidratación profunda. Incluye análisis de piel, limpieza, exfoliación, extracción, mascarilla y hidratación.',
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
            description: 'Masaje corporal completo para liberar tensiones y mejorar la circulación. Técnicas de relajación profunda con aceites esenciales.',
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
            description: 'Tratamiento avanzado con tecnología de radiofrecuencia para combatir los signos del envejecimiento. Estimula la producción de colágeno.',
            images: ['/images/anti-aging.jpg'],
            requirements: [],
            isActive: true
          },
          {
            id: '4',
            name: 'Peeling Químico',
            category: 'facial',
            price: 95,
            duration: 45,
            description: 'Exfoliación química profunda para renovar la piel y mejorar su textura. Ideal para manchas y cicatrices.',
            images: ['/images/peeling.jpg'],
            requirements: ['No exposición solar reciente'],
            isActive: true
          },
          {
            id: '5',
            name: 'Masaje con Piedras Calientes',
            category: 'spa',
            price: 110,
            duration: 90,
            description: 'Relajación profunda con piedras volcánicas calientes. Libera tensiones y mejora la circulación sanguínea.',
            images: ['/images/hot-stones.jpg'],
            requirements: [],
            isActive: true
          },
          {
            id: '6',
            name: 'Tratamiento Corporal Reafirmante',
            category: 'corporal',
            price: 85,
            duration: 60,
            description: 'Tratamiento para mejorar la firmeza y elasticidad de la piel corporal. Incluye exfoliación y mascarilla reafirmante.',
            images: ['/images/body-firming.jpg'],
            requirements: [],
            isActive: true
          }
        ];
        setServices(mockServices);
        setFilteredServices(mockServices);
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
        service.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(service => service.category === selectedCategory);
    }

    // Filter by price range
    filtered = filtered.filter(service => 
      service.price >= priceRange[0] && service.price <= priceRange[1]
    );

    setFilteredServices(filtered);
  }, [services, searchTerm, selectedCategory, priceRange]);

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
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
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
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
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
                          className="h-4 w-4 text-rose-600 focus:ring-rose-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {category.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rango de Precio: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>
            </div>

            {/* Services Grid */}
            <div className="lg:w-3/4">
              <div className="flex justify-between items-center mb-6">
                <p className="text-gray-600">
                  {filteredServices.length} servicios encontrados
                </p>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
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
              ) : filteredServices.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No se encontraron servicios
                  </h3>
                  <p className="text-gray-600">
                    Intenta ajustar los filtros para ver más resultados.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredServices.map((service) => (
                    <div key={service.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                      <div className="relative h-48 overflow-hidden">
                        <ServiceImage
                          src={service.images?.[0] || ''}
                          alt={service.name}
                          className="w-full h-full object-cover"
                          fallbackClassName="w-full h-full"
                        />
                      </div>
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-rose-600 bg-rose-100 px-2 py-1 rounded-full">
                            {categories.find(c => c.id === service.category)?.name || service.category}
                          </span>
                          <div className="text-2xl font-bold text-rose-600">
                            {formatPrice(service.price)}
                          </div>
                        </div>
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
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/servicios/${service.id}`}
                            className="flex-1 bg-rose-600 text-white py-2 px-4 rounded-lg hover:bg-rose-700 transition-colors duration-200 font-medium text-center"
                          >
                            Ver Detalles
                          </Link>
                          <Link
                            href={`/reservar?service=${service.id}`}
                            className="flex-1 border border-rose-600 text-rose-600 py-2 px-4 rounded-lg hover:bg-rose-600 hover:text-white transition-colors duration-200 font-medium text-center"
                          >
                            Reservar
                          </Link>
                        </div>
                      </div>
                    </div>
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
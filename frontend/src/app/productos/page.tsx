'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Loading from '@/components/Loading';
import { Product } from '@/types';
import { productsApi } from '@/services/api';
import { Search, Filter, ShoppingCart, Sparkles } from 'lucide-react';
import Link from 'next/link';
import ServiceImage from '@/components/ServiceImage';
import { formatPrice } from '@/utils/currency';
import { themeColors, dynamicStyles, hoverEffects } from '@/utils/colors';

const ProductsContent = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([
    { id: 'all', name: 'Todos los Productos' }
  ]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  
  const searchParams = useSearchParams();

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await productsApi.getCategories();
        setCategories([
          { id: 'all', name: 'Todos los Productos' },
          ...categoriesData
        ]);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };

    const loadProducts = async () => {
      try {
        console.log('🔄 Cargando productos desde API...');
        const productsData = await productsApi.getAll();
        console.log('✅ Productos cargados:', productsData);
        console.log('📸 Primer producto completo:', productsData[0]);
        console.log('📸 Imágenes del primer producto:', productsData[0]?.images);
        setProducts(productsData);
        setFilteredProducts(productsData);
      } catch (error) {
        console.error('❌ Error loading products:', error);
        setProducts([]);
        setFilteredProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
    loadProducts();
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

  const addToCart = (productId: string) => {
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
  };

  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory]);

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Nuestros Productos
            </h1>
            <p className="text-xl text-gray-600">
              Productos de belleza de alta calidad para el cuidado en casa
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters */}
            <div className="lg:w-1/4">
              <Card className="sticky top-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Filter className="h-5 w-5 mr-2" style={{ color: themeColors.primary }} />
                  Filtros
                </h3>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar productos..."
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

            {/* Products Grid */}
            <div className="lg:w-3/4">
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
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
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
                        <div className="flex items-center justify-between mb-2">
                          <span 
                            className="text-xs font-medium px-2 py-1 rounded-full"
                            style={{ 
                              color: themeColors.primary,
                              backgroundColor: themeColors.primaryLight 
                            }}
                          >
                            {categories.find(c => c.id === product.category)?.name || product.category}
                          </span>
                          <div className="text-sm text-gray-500">
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
                        <div className="flex flex-col gap-2">
                          <Button
                            href={`/productos/${product.id}`}
                            variant="primary"
                            size="sm"
                            fullWidth
                          >
                            Ver Detalles
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            fullWidth
                            onClick={() => addToCart(product.id)}
                            className="flex items-center justify-center"
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Añadir al Carrito
                            {cart[product.id] && (
                              <span 
                                className="ml-2 text-white rounded-full px-2 py-1 text-xs"
                                style={{ backgroundColor: themeColors.primaryHover }}
                              >
                                {cart[product.id]}
                              </span>
                            )}
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

const ProductsPage = () => {
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
      <ProductsContent />
    </Suspense>
  );
};

export default ProductsPage;
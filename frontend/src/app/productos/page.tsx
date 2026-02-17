'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Loading from '@/components/Loading';
import { Product } from '@/types';
import { productsApi } from '@/services/api';
import { Search, Filter, ShoppingCart, Sparkles, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import ServiceImage from '@/components/ServiceImage';
import { formatPrice } from '@/utils/currency';
import { themeColors, dynamicStyles, hoverEffects } from '@/utils/colors';

interface ShippingFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
}

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
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [shippingForm, setShippingForm] = useState<ShippingFormData>({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [formErrors, setFormErrors] = useState<Partial<ShippingFormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
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

  const addToCart = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setShowShippingModal(true);
  };

  const validateShippingForm = (): boolean => {
    const errors: Partial<ShippingFormData> = {};
    
    if (!shippingForm.name.trim()) {
      errors.name = 'El nombre es requerido';
    }
    
    if (!shippingForm.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingForm.email)) {
      errors.email = 'Email inválido';
    }
    
    if (!shippingForm.phone.trim()) {
      errors.phone = 'El teléfono es requerido';
    } else if (!/^[+]?[\d\s-()]+$/.test(shippingForm.phone)) {
      errors.phone = 'Teléfono inválido';
    }
    
    if (!shippingForm.address.trim()) {
      errors.address = 'La dirección es requerida';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateShippingForm() || !selectedProduct) return;
    
    setSubmitting(true);
    setSubmitError('');
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/product-payment/${selectedProduct.id}/request-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: shippingForm.name,
          email: shippingForm.email,
          phone: shippingForm.phone,
          address: shippingForm.address,
          quantity
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.message || data.error || 'Error al procesar la solicitud';
        throw new Error(errorMessage);
      }
      
      setSubmitSuccess(true);
      setTimeout(() => {
        setShowShippingModal(false);
        setSubmitSuccess(false);
        setShippingForm({ name: '', email: '', phone: '', address: '' });
        setQuantity(1);
        setSelectedProduct(null);
      }, 3000);
      
    } catch (error: any) {
      console.error('Error submitting shipping form:', error);
      setSubmitError(error.message || 'Error al enviar la solicitud. Por favor intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    if (!submitting) {
      setShowShippingModal(false);
      setShippingForm({ name: '', email: '', phone: '', address: '' });
      setFormErrors({});
      setSubmitError('');
      setSubmitSuccess(false);
      setSelectedProduct(null);
    }
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
      filtered = filtered.filter(product => {
        // Check if product has categories array
        if (product.categories && product.categories.length > 0) {
          return product.categories.includes(selectedCategory);
        }
        // Fallback to primary category for backward compatibility
        return product.category === selectedCategory;
      });
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
                                  title={index === 0 ? 'Categoría principal' : ''}
                                >
                                  {categories.find(c => c.id === cat)?.name || cat}
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
                                {categories.find(c => c.id === product.category)?.name || product.category}
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
                            onClick={() => addToCart(product)}
                            className="flex items-center justify-center"
                            disabled={product.stock === 0}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            {product.stock > 0 ? 'Añadir al Carrito' : 'Agotado'}
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

        {/* Shipping Form Modal */}
        {showShippingModal && selectedProduct && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(255, 255, 255, 0.3)' }}>
            <div className="bg-white rounded-lg max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
              {!submitSuccess ? (
                <>
                  <button
                    onClick={handleCloseModal}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                    disabled={submitting}
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Información de Envío
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Completa tus datos para recibir el link de pago
                  </p>

                  <form onSubmit={handleSubmitShipping} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        value={shippingForm.name}
                        onChange={(e) => setShippingForm({ ...shippingForm, name: e.target.value })}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                          formErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Juan Pérez"
                        disabled={submitting}
                      />
                      {formErrors.name && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={shippingForm.email}
                        onChange={(e) => setShippingForm({ ...shippingForm, email: e.target.value })}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                          formErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                        }`}
                        placeholder="tu@email.com"
                        disabled={submitting}
                      />
                      {formErrors.email && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        value={shippingForm.phone}
                        onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                          formErrors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="+56 9 1234 5678"
                        disabled={submitting}
                      />
                      {formErrors.phone && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dirección de Envío *
                      </label>
                      <textarea
                        value={shippingForm.address}
                        onChange={(e) => setShippingForm({ ...shippingForm, address: e.target.value })}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                          formErrors.address ? 'border-red-500' : 'border-gray-300'
                        }`}
                        rows={3}
                        placeholder="Calle, número, comuna, ciudad"
                        disabled={submitting}
                      />
                      {formErrors.address && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.address}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cantidad
                      </label>
                      <div className="flex items-center border border-gray-300 rounded-lg w-fit">
                        <button
                          type="button"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                          disabled={quantity <= 1 || submitting}
                        >
                          -
                        </button>
                        <span className="px-6 py-2 border-x border-gray-300 font-semibold">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(Math.min(selectedProduct.stock, quantity + 1))}
                          className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                          disabled={quantity >= selectedProduct.stock || submitting}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Producto:</span>
                        <span className="font-medium">{selectedProduct.name}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Cantidad:</span>
                        <span className="font-medium">{quantity}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold pt-2 border-t">
                        <span>Total:</span>
                        <span style={{ color: themeColors.primary }}>
                          {formatPrice(selectedProduct.price * quantity)}
                        </span>
                      </div>
                    </div>

                    {submitError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {submitError}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        disabled={submitting}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-3 text-white rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: themeColors.primary }}
                        disabled={submitting}
                        onMouseEnter={(e) => !submitting && (e.currentTarget.style.filter = 'brightness(0.9)')}
                        onMouseLeave={(e) => !submitting && (e.currentTarget.style.filter = '')}
                      >
                        {submitting ? 'Enviando...' : 'Solicitar Pago'}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <CheckCircle className="h-16 w-16 mx-auto" style={{ color: themeColors.primary }} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    ¡Solicitud Enviada!
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Recibirás un correo electrónico con el link de pago en breve.
                  </p>
                  <p className="text-sm text-gray-500">
                    Esta ventana se cerrará automáticamente...
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
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

export const dynamic = 'force-dynamic';

export default ProductsPage;
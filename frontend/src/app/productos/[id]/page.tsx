'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { Product } from '@/types';
import { productsApi } from '@/services/api';
import { ArrowLeft, ShoppingCart, Package, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import ServiceImage from '@/components/ServiceImage';
import { formatPrice } from '@/utils/currency';
import { themeColors } from '@/utils/colors';

interface ShippingFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
}

const ProductDetailPage = () => {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
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

  useEffect(() => {
    const loadProduct = async () => {
      try {
        if (params.id) {
          const productData = await productsApi.getById(params.id as string);
          console.log('Product data received:', productData);
          setProduct(productData);
        }
      } catch (error) {
        console.error('Error loading product:', error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [params.id]);

  const handleAddToCart = () => {
    if (!product) return;
    
    console.log('Product paymentLink:', product.paymentLink);
    
    // SIEMPRE abrir modal de envío para productos
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
    
    if (!validateShippingForm() || !product) return;
    
    setSubmitting(true);
    setSubmitError('');
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/product-payment/${product.id}/request-payment`, {
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
      
      console.log('Response status:', response.status);
      console.log('Response data:', data);
      
      if (!response.ok) {
        const errorMessage = data.message || data.error || 'Error al procesar la solicitud';
        console.error('Error from backend:', errorMessage);
        throw new Error(errorMessage);
      }
      
      setSubmitSuccess(true);
      setTimeout(() => {
        setShowShippingModal(false);
        setSubmitSuccess(false);
        setShippingForm({ name: '', email: '', phone: '', address: '' });
        setQuantity(1);
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
    }
  };

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

  if (!product) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Producto no encontrado
            </h2>
            <p className="text-gray-600 mb-8">
              El producto que buscas no existe o ha sido eliminado.
            </p>
            <Link
              href="/productos"
              className="text-white px-6 py-3 rounded-lg transition-colors duration-200 font-medium"
              style={{ backgroundColor: themeColors.primary }}
              onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(0.9)'}
              onMouseLeave={(e) => e.currentTarget.style.filter = ''}
            >
              Ver Todos los Productos
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
          <Link 
            href="/" 
            className="transition-colors"
            style={{ color: 'inherit' }}
            onMouseEnter={(e) => e.currentTarget.style.color = themeColors.primary}
            onMouseLeave={(e) => e.currentTarget.style.color = ''}
          >
            Inicio
          </Link>
          <span>/</span>
          <Link 
            href="/productos" 
            className="transition-colors"
            style={{ color: 'inherit' }}
            onMouseEnter={(e) => e.currentTarget.style.color = themeColors.primary}
            onMouseLeave={(e) => e.currentTarget.style.color = ''}
          >
            Productos
          </Link>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        {/* Back Button */}
        <Link
          href="/productos"
          className="inline-flex items-center mb-6 transition-colors"
          style={{ color: themeColors.primary }}
          onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(0.9)'}
          onMouseLeave={(e) => e.currentTarget.style.filter = ''}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Productos
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center p-4">
              <ServiceImage
                src={product.images?.[selectedImageIndex] || ''}
                alt={product.name}
                className="max-w-full max-h-full object-contain"
                fallbackClassName="w-full h-full"
              />
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <div 
                    key={index} 
                    className={`relative aspect-square rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center p-2 cursor-pointer transition-all duration-300 ${
                      selectedImageIndex === index 
                        ? 'ring-offset-2' 
                        : 'hover:opacity-80'
                    }`}
                    style={selectedImageIndex === index ? { 
                      boxShadow: `0 0 0 2px ${themeColors.primary}`,
                      outline: `2px solid ${themeColors.primary}`,
                      outlineOffset: '2px'
                    } : {}}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <ServiceImage
                      src={image}
                      alt={`${product.name} - imagen ${index + 1}`}
                      className="max-w-full max-h-full object-contain"
                      fallbackClassName="w-full h-full"
                    />
                  </div>
                ))}
              </div>
            )}
            
            {/* Additional Info - Moved here for large screens */}
            <div 
              className="hidden lg:block p-6 rounded-lg"
              style={{ backgroundColor: `${themeColors.primary}15` }}
            >
              <h3 className="font-semibold text-gray-900 mb-2">
                ¿Tienes dudas sobre este producto?
              </h3>
              <p className="text-gray-600 mb-4">
                Nuestro equipo está disponible para resolver todas tus consultas 
                y ayudarte a elegir el mejor producto para ti.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button 
                  className="text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium"
                  style={{ backgroundColor: themeColors.primary }}
                  onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(0.9)'}
                  onMouseLeave={(e) => e.currentTarget.style.filter = ''}
                >
                  Chat en Vivo
                </button>
                <a
                  href="tel:+34123456789"
                  className="border px-4 py-2 rounded-lg transition-all duration-200 font-medium text-center"
                  style={{ borderColor: themeColors.primary, color: themeColors.primary }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = themeColors.primary;
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '';
                    e.currentTarget.style.color = themeColors.primary;
                  }}
                >
                  Llamar Ahora
                </a>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {product.categories && product.categories.length > 0 ? (
                  product.categories.map((cat, index) => (
                    <Link
                      key={index}
                      href={`/productos?category=${cat}`}
                      className="text-sm font-medium px-3 py-1 rounded-full transition-all duration-300 hover:shadow-md"
                      style={{ 
                        color: index === 0 ? 'white' : themeColors.primary,
                        backgroundColor: index === 0 ? themeColors.primary : `${themeColors.primary}15`,
                        fontWeight: index === 0 ? 600 : 500
                      }}
                      title={index === 0 ? 'Categoría principal - Click para ver más productos' : 'Click para ver más productos'}
                      onMouseEnter={(e) => {
                        if (index === 0) {
                          e.currentTarget.style.filter = 'brightness(0.9)';
                        } else {
                          e.currentTarget.style.backgroundColor = themeColors.primary;
                          e.currentTarget.style.color = 'white';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (index === 0) {
                          e.currentTarget.style.filter = '';
                        } else {
                          e.currentTarget.style.backgroundColor = `${themeColors.primary}15`;
                          e.currentTarget.style.color = themeColors.primary;
                        }
                      }}
                    >
                      {cat}
                    </Link>
                  ))
                ) : (
                  <Link
                    href={`/productos?category=${product.category}`}
                    className="text-sm font-medium px-3 py-1 rounded-full transition-all duration-300 hover:shadow-md"
                    style={{ 
                      color: themeColors.primary,
                      backgroundColor: `${themeColors.primary}15`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = themeColors.primary;
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = `${themeColors.primary}15`;
                      e.currentTarget.style.color = themeColors.primary;
                    }}
                  >
                    {product.category}
                  </Link>
                )}
                {product.stock > 0 ? (
                  <span className="text-sm font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    En Stock ({product.stock} disponibles)
                  </span>
                ) : (
                  <span className="text-sm font-medium text-red-600 bg-red-100 px-3 py-1 rounded-full">
                    Agotado
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>
              <div className="text-3xl font-bold mb-4" style={{ color: themeColors.primary }}>
                {formatPrice(product.price)}
              </div>
            </div>

            {product.description && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Descripción del Producto
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {product.ingredients && product.ingredients.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Ingredientes
                </h2>
                <ul className="space-y-2">
                  {product.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" style={{ color: themeColors.primary }} />
                      <span className="text-gray-600">{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.compatibleServices && product.compatibleServices.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Compatible con Servicios
                </h2>
                <div className="flex flex-wrap gap-2">
                  {product.compatibleServices.map((service, index) => (
                    <span
                      key={index}
                      className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity and Add to Cart */}
            <div className="border-t pt-6">
              <div className="flex items-center gap-4 mb-4">
                <label className="text-gray-700 font-medium">Cantidad:</label>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="px-6 py-2 border-x border-gray-300 font-semibold">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-full text-white py-4 px-6 rounded-lg transition-all duration-200 font-semibold text-center flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                style={product.stock > 0 ? { 
                  backgroundColor: addedToCart ? '#10b981' : themeColors.primary 
                } : {}}
                onMouseEnter={(e) => {
                  if (product.stock > 0 && !addedToCart) e.currentTarget.style.filter = 'brightness(0.9)';
                }}
                onMouseLeave={(e) => {
                  if (product.stock > 0 && !addedToCart) e.currentTarget.style.filter = '';
                }}
              >
                {addedToCart ? (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    ¡Agregado al Carrito!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {product.stock > 0 ? 'Añadir al Carrito' : 'Producto Agotado'}
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center text-sm text-gray-600">
                <Package className="h-4 w-4 mr-2" />
                Envío gratis en compras superiores a $50.000
              </div>
            </div>

            {/* Additional Info - Visible only on mobile/tablet */}
            <div 
              className="lg:hidden p-6 rounded-lg"
              style={{ backgroundColor: `${themeColors.primary}15` }}
            >
              <h3 className="font-semibold text-gray-900 mb-2">
                ¿Tienes dudas sobre este producto?
              </h3>
              <p className="text-gray-600 mb-4">
                Nuestro equipo está disponible para resolver todas tus consultas 
                y ayudarte a elegir el mejor producto para ti.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button 
                  className="text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium"
                  style={{ backgroundColor: themeColors.primary }}
                  onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(0.9)'}
                  onMouseLeave={(e) => e.currentTarget.style.filter = ''}
                >
                  Chat en Vivo
                </button>
                <a
                  href="tel:+34123456789"
                  className="border px-4 py-2 rounded-lg transition-all duration-200 font-medium text-center"
                  style={{ borderColor: themeColors.primary, color: themeColors.primary }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = themeColors.primary;
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '';
                    e.currentTarget.style.color = themeColors.primary;
                  }}
                >
                  Llamar Ahora
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Productos Relacionados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Mock related products */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                <div 
                  className="relative h-48 overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${themeColors.primary}30, ${themeColors.primary}50)` }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Package className="h-16 w-16" style={{ color: themeColors.primary }} />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Producto Relacionado {i}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Descripción breve del producto relacionado.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold" style={{ color: themeColors.primary }}>{formatPrice(30 + i * 10)}</span>
                    <Link
                      href={`/productos/${i}`}
                      className="text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium"
                      style={{ backgroundColor: themeColors.primary }}
                      onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(0.9)'}
                      onMouseLeave={(e) => e.currentTarget.style.filter = ''}
                    >
                      Ver Detalles
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Form Modal */}
        {showShippingModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(255, 255, 255, 0.3)' }}>
            <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
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

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Producto:</span>
                        <span className="font-medium">{product?.name}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Cantidad:</span>
                        <span className="font-medium">{quantity}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold pt-2 border-t">
                        <span>Total:</span>
                        <span style={{ color: themeColors.primary }}>
                          {formatPrice((product?.price || 0) * quantity)}
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

export default ProductDetailPage;

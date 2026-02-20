export interface Product {
  id: string;
  name: string;
  slug: string; // URL amigable para SEO
  category: string; // Categoría primaria (backward compatibility)
  categories: string[]; // Todas las categorías asignadas
  price: number;
  paymentLink?: string; // Link de pago (Mercado Pago, Flow, etc.)
  stock: number;
  minStock: number;
  description?: string;
  benefits?: string; // Beneficios del producto (HTML con formato enriquecido)
  images: string[];
  ingredients: string[];
  compatibleServices: string[];
  isActive: boolean; // Estado de activación del producto
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductRequest {
  name: string;
  slug?: string; // Opcional, se genera automáticamente si no se proporciona
  category: string; // Categoría primaria
  categories?: string[]; // Categorías adicionales (opcional)
  price: number;
  paymentLink?: string; // Link de pago (opcional)
  stock: number;
  minStock?: number;
  description?: string;
  benefits?: string; // Beneficios del producto (opcional)
  images?: string[];
  ingredients?: string[];
  compatibleServices?: string[];
  isActive?: boolean; // Estado de activación (opcional, por defecto true)
}

export interface UpdateProductRequest {
  name?: string;
  slug?: string; // Actualizar slug manualmente (se regenera automáticamente si cambia el nombre)
  category?: string; // Actualizar categoría primaria
  categories?: string[]; // Actualizar todas las categorías
  price?: number;
  paymentLink?: string; // Actualizar link de pago
  stock?: number;
  minStock?: number;
  description?: string;
  benefits?: string; // Actualizar beneficios
  images?: string[];
  ingredients?: string[];
  compatibleServices?: string[];
  isActive?: boolean; // Actualizar estado de activación
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  lowStock?: boolean;
  isActive?: boolean; // Filtrar por estado de activación
  search?: string;
  page?: number;
  limit?: number;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  referenceId?: string;
  createdAt: Date;
}

export interface ProductStats {
  totalProducts: number;
  inStockProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalValue: number;
  categoriesCount: number;
  averagePrice: number;
}

export interface LowStockAlert {
  product: Product;
  currentStock: number;
  minStock: number;
  difference: number;
}
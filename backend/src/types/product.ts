export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  minStock: number;
  description?: string;
  images: string[];
  ingredients: string[];
  compatibleServices: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductRequest {
  name: string;
  category: string;
  price: number;
  stock: number;
  minStock?: number;
  description?: string;
  images?: string[];
  ingredients?: string[];
  compatibleServices?: string[];
}

export interface UpdateProductRequest {
  name?: string;
  category?: string;
  price?: number;
  stock?: number;
  minStock?: number;
  description?: string;
  images?: string[];
  ingredients?: string[];
  compatibleServices?: string[];
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  lowStock?: boolean;
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
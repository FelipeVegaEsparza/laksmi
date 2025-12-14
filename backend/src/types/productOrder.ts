export interface ProductOrder {
  id: string;
  productId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  paymentStatus: 'pending' | 'paid';
  paymentLink?: string;
  createdAt: Date;
  updatedAt: Date;
  // Datos del producto (join)
  productName?: string;
  productImage?: string;
}

export interface CreateProductOrderRequest {
  productId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  paymentLink?: string;
}

export interface UpdateProductOrderRequest {
  paymentStatus?: 'pending' | 'paid';
}

export interface ProductOrderFilters {
  productId?: string;
  paymentStatus?: 'pending' | 'paid';
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

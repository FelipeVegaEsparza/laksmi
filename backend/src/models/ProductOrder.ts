import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import {
  ProductOrder,
  CreateProductOrderRequest,
  UpdateProductOrderRequest,
  ProductOrderFilters
} from '../types/productOrder';

export class ProductOrderModel {
  /**
   * Crear una nueva orden de producto
   */
  static async create(orderData: CreateProductOrderRequest): Promise<ProductOrder> {
    const id = uuidv4();
    
    await db('product_orders').insert({
      id,
      product_id: orderData.productId,
      customer_name: orderData.customerName,
      customer_email: orderData.customerEmail,
      customer_phone: orderData.customerPhone,
      customer_address: orderData.customerAddress,
      quantity: orderData.quantity,
      unit_price: orderData.unitPrice,
      total_price: orderData.totalPrice,
      payment_link: orderData.paymentLink || null
    });

    const order = await this.findById(id);
    if (!order) {
      throw new Error('Error al crear la orden');
    }

    return order;
  }

  /**
   * Buscar orden por ID
   */
  static async findById(id: string): Promise<ProductOrder | null> {
    const rows = await db('product_orders as po')
      .leftJoin('products as p', 'po.product_id', 'p.id')
      .select(
        'po.*',
        'p.name as product_name',
        'p.images as product_images'
      )
      .where('po.id', id);

    if (rows.length === 0) {
      return null;
    }

    return this.formatOrder(rows[0]);
  }

  /**
   * Obtener todas las órdenes con filtros
   */
  static async findAll(filters: ProductOrderFilters = {}): Promise<{
    orders: ProductOrder[];
    total: number;
    page: number;
  }> {
    const {
      productId,
      paymentStatus,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20
    } = filters;

    let query = db('product_orders as po')
      .leftJoin('products as p', 'po.product_id', 'p.id')
      .select(
        'po.*',
        'p.name as product_name',
        'p.images as product_images'
      );

    if (productId) {
      query = query.where('po.product_id', productId);
    }

    if (paymentStatus) {
      query = query.where('po.payment_status', paymentStatus);
    }

    if (dateFrom) {
      query = query.where('po.created_at', '>=', dateFrom);
    }

    if (dateTo) {
      query = query.where('po.created_at', '<=', dateTo);
    }

    // Contar total
    const countQuery = query.clone();
    const countResult = await countQuery.count('* as total').first();
    const total = countResult?.total || 0;

    // Agregar ordenamiento y paginación
    const rows = await query
      .orderBy('po.created_at', 'desc')
      .limit(limit)
      .offset((page - 1) * limit);

    return {
      orders: rows.map((row: any) => this.formatOrder(row)),
      total: Number(total),
      page
    };
  }

  /**
   * Actualizar estado de pago de una orden
   */
  static async updatePaymentStatus(
    id: string,
    paymentStatus: 'pending' | 'paid'
  ): Promise<ProductOrder | null> {
    await db('product_orders')
      .where('id', id)
      .update({
        payment_status: paymentStatus,
        updated_at: db.fn.now()
      });

    return this.findById(id);
  }

  /**
   * Eliminar una orden
   */
  static async delete(id: string): Promise<boolean> {
    const result = await db('product_orders')
      .where('id', id)
      .delete();

    return result > 0;
  }

  /**
   * Obtener estadísticas de órdenes
   */
  static async getStats(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    paidOrders: number;
    totalRevenue: number;
    pendingRevenue: number;
  }> {
    const result = await db('product_orders')
      .select(
        db.raw('COUNT(*) as total_orders'),
        db.raw("SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as pending_orders"),
        db.raw("SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid_orders"),
        db.raw('SUM(total_price) as total_revenue'),
        db.raw("SUM(CASE WHEN payment_status = 'pending' THEN total_price ELSE 0 END) as pending_revenue")
      )
      .first();

    return {
      totalOrders: Number(result?.total_orders) || 0,
      pendingOrders: Number(result?.pending_orders) || 0,
      paidOrders: Number(result?.paid_orders) || 0,
      totalRevenue: parseFloat(result?.total_revenue) || 0,
      pendingRevenue: parseFloat(result?.pending_revenue) || 0
    };
  }

  /**
   * Formatear orden desde la base de datos
   */
  private static formatOrder(row: any): ProductOrder {
    // Parsear imágenes del producto si existen
    let productImage: string | undefined;
    if (row.product_images) {
      try {
        const images = JSON.parse(row.product_images);
        productImage = images[0];
      } catch (e) {
        productImage = undefined;
      }
    }

    return {
      id: row.id,
      productId: row.product_id,
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      customerPhone: row.customer_phone,
      customerAddress: row.customer_address,
      quantity: row.quantity,
      unitPrice: parseFloat(row.unit_price),
      totalPrice: parseFloat(row.total_price),
      paymentStatus: row.payment_status,
      paymentLink: row.payment_link,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      productName: row.product_name,
      productImage
    };
  }
}

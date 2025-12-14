import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
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
    
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO product_orders (
        id, product_id, customer_name, customer_email, customer_phone,
        customer_address, quantity, unit_price, total_price, payment_link
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        orderData.productId,
        orderData.customerName,
        orderData.customerEmail,
        orderData.customerPhone,
        orderData.customerAddress,
        orderData.quantity,
        orderData.unitPrice,
        orderData.totalPrice,
        orderData.paymentLink || null
      ]
    );

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
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        po.*,
        p.name as product_name,
        p.images as product_images
      FROM product_orders po
      LEFT JOIN products p ON po.product_id = p.id
      WHERE po.id = ?`,
      [id]
    );

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

    let query = `
      SELECT 
        po.*,
        p.name as product_name,
        p.images as product_images
      FROM product_orders po
      LEFT JOIN products p ON po.product_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (productId) {
      query += ' AND po.product_id = ?';
      params.push(productId);
    }

    if (paymentStatus) {
      query += ' AND po.payment_status = ?';
      params.push(paymentStatus);
    }

    if (dateFrom) {
      query += ' AND po.created_at >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      query += ' AND po.created_at <= ?';
      params.push(dateTo);
    }

    // Contar total
    const countQuery = query.replace(
      /SELECT .+ FROM/,
      'SELECT COUNT(*) as total FROM'
    );
    const [countRows] = await pool.execute<RowDataPacket[]>(countQuery, params);
    const total = countRows[0].total;

    // Agregar ordenamiento y paginación
    query += ' ORDER BY po.created_at DESC';
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);

    return {
      orders: rows.map(row => this.formatOrder(row)),
      total,
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
    await pool.execute(
      'UPDATE product_orders SET payment_status = ?, updated_at = NOW() WHERE id = ?',
      [paymentStatus, id]
    );

    return this.findById(id);
  }

  /**
   * Eliminar una orden
   */
  static async delete(id: string): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM product_orders WHERE id = ?',
      [id]
    );

    return result.affectedRows > 0;
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
    const [rows] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid_orders,
        SUM(total_price) as total_revenue,
        SUM(CASE WHEN payment_status = 'pending' THEN total_price ELSE 0 END) as pending_revenue
      FROM product_orders
    `);

    const stats = rows[0];
    return {
      totalOrders: stats.total_orders || 0,
      pendingOrders: stats.pending_orders || 0,
      paidOrders: stats.paid_orders || 0,
      totalRevenue: parseFloat(stats.total_revenue) || 0,
      pendingRevenue: parseFloat(stats.pending_revenue) || 0
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

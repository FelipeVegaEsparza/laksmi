import { Request, Response } from 'express';
import { ProductOrderModel } from '../models/ProductOrder';
import { ProductOrderFilters } from '../types/productOrder';
import logger from '../utils/logger';

export class ProductOrderController {
  /**
   * Obtener todas las órdenes con filtros
   */
  static async getOrders(req: Request, res: Response): Promise<void> {
    try {
      const {
        productId,
        paymentStatus,
        dateFrom,
        dateTo,
        page,
        limit
      } = req.query;

      const filters: ProductOrderFilters = {
        productId: productId as string,
        paymentStatus: paymentStatus as 'pending' | 'paid',
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20
      };

      const result = await ProductOrderModel.findAll(filters);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error getting product orders:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener las órdenes'
      });
    }
  }

  /**
   * Obtener una orden por ID
   */
  static async getOrderById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const order = await ProductOrderModel.findById(id);

      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Orden no encontrada'
        });
        return;
      }

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      logger.error('Error getting product order:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener la orden'
      });
    }
  }

  /**
   * Actualizar estado de pago de una orden
   */
  static async updatePaymentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { paymentStatus } = req.body;

      if (!paymentStatus || !['pending', 'paid'].includes(paymentStatus)) {
        res.status(400).json({
          success: false,
          message: 'Estado de pago inválido. Debe ser "pending" o "paid"'
        });
        return;
      }

      const order = await ProductOrderModel.updatePaymentStatus(id, paymentStatus);

      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Orden no encontrada'
        });
        return;
      }

      logger.info(`Order ${id} payment status updated to ${paymentStatus}`);

      res.json({
        success: true,
        message: 'Estado de pago actualizado correctamente',
        data: order
      });
    } catch (error) {
      logger.error('Error updating payment status:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar el estado de pago'
      });
    }
  }

  /**
   * Eliminar una orden
   */
  static async deleteOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const deleted = await ProductOrderModel.delete(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Orden no encontrada'
        });
        return;
      }

      logger.info(`Order ${id} deleted`);

      res.json({
        success: true,
        message: 'Orden eliminada correctamente'
      });
    } catch (error) {
      logger.error('Error deleting order:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar la orden'
      });
    }
  }

  /**
   * Obtener estadísticas de órdenes
   */
  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await ProductOrderModel.getStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting order stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas'
      });
    }
  }
}

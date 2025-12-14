import { Request, Response } from 'express';
import { ProductModel } from '../models/Product';
import logger from '../utils/logger';

interface ProductPaymentRequest {
  name: string;
  email: string;
  phone: string;
  address: string;
  quantity: number;
}

export class ProductPaymentController {
  /**
   * Solicitar pago de producto - Envía email con link de pago
   */
  static async requestPayment(req: Request, res: Response): Promise<void> {
    try {
      const { id: productId } = req.params;
      const { name, email, phone, address, quantity }: ProductPaymentRequest = req.body;

      // Validar datos requeridos
      if (!name || !email || !phone || !address || !quantity) {
        res.status(400).json({
          success: false,
          message: 'Todos los campos son requeridos: nombre, email, teléfono, dirección y cantidad'
        });
        return;
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          message: 'El email proporcionado no es válido'
        });
        return;
      }

      if (quantity <= 0) {
        res.status(400).json({
          success: false,
          message: 'La cantidad debe ser mayor a 0'
        });
        return;
      }

      // Obtener producto de la base de datos
      const product = await ProductModel.findById(productId);

      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
        return;
      }

      // El link de pago es opcional - si no existe, el email se enviará sin él

      // Verificar stock disponible
      if (product.stock < quantity) {
        res.status(400).json({
          success: false,
          message: `Stock insuficiente. Solo hay ${product.stock} unidades disponibles`
        });
        return;
      }

      // Calcular total
      const total = product.price * quantity;

      // Guardar la orden en la base de datos
      let orderId: string | undefined;
      try {
        const { ProductOrderModel } = await import('../models/ProductOrder');
        const order = await ProductOrderModel.create({
          productId: product.id,
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          customerAddress: address,
          quantity,
          unitPrice: product.price,
          totalPrice: total,
          paymentLink: product.paymentLink
        });
        orderId = order.id;
        logger.info(`Product order created: ${orderId}`);
      } catch (error) {
        logger.error('Error creating product order:', error);
        // Continuar aunque falle la creación de la orden
      }

      // Enviar emails usando EmailService (al cliente y al admin)
      let clientEmailSent = false;
      let adminEmailSent = false;

      try {
        const { EmailService } = await import('../services/EmailService');
        const { CompanySettingsModel } = await import('../models/CompanySettings');
        
        // 1. Enviar email al CLIENTE con el link de pago
        clientEmailSent = await EmailService.sendProductPaymentToClient(email, {
          customerName: name,
          productName: product.name,
          productPrice: product.price,
          quantity,
          total,
          paymentLink: product.paymentLink || '',
          productImage: product.images && product.images.length > 0 ? product.images[0] : undefined
        });

        // 2. Enviar email al ADMIN con los datos del cliente
        const companySettings = await CompanySettingsModel.getSettings();
        const adminEmail = companySettings?.contactEmail || process.env.SMTP_USER;
        
        if (adminEmail) {
          adminEmailSent = await EmailService.sendProductPaymentToAdmin(adminEmail, {
            customerName: name,
            customerPhone: phone,
            customerAddress: address,
            productName: product.name,
            productPrice: product.price,
            quantity,
            total,
            paymentLink: product.paymentLink || '',
            productImage: product.images && product.images.length > 0 ? product.images[0] : undefined
          });
        }
      } catch (error) {
        logger.error('Error sending product payment emails:', error);
      }

      logger.info(`Product payment request processed - Client email: ${clientEmailSent}, Admin email: ${adminEmailSent}`);

      res.status(200).json({
        success: true,
        message: 'Solicitud de pago enviada exitosamente. Recibirás un correo con el link de pago.',
        data: {
          productName: product.name,
          quantity,
          total,
          estimatedDelivery: '3-5 días hábiles'
        }
      });

    } catch (error) {
      logger.error('Error en requestPayment:', error);
      res.status(500).json({
        success: false,
        message: 'Error al procesar la solicitud de pago'
      });
    }
  }
}

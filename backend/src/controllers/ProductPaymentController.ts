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

      // Enviar emails usando EmailService (al cliente y al admin)
      logger.info('📧 Iniciando envío de emails...');
      logger.info(`📧 Email cliente: ${email}`);
      logger.info(`📧 Producto: ${product.name}`);
      
      let clientEmailSent = false;
      let adminEmailSent = false;

      try {
        const { EmailService } = await import('../services/EmailService');
        const { CompanySettingsModel } = await import('../models/CompanySettings');
        
        // 1. Enviar email al CLIENTE con el link de pago
        logger.info('📧 Enviando email al cliente...');
        clientEmailSent = await EmailService.sendProductPaymentToClient(email, {
          customerName: name,
          productName: product.name,
          productPrice: product.price,
          quantity,
          total,
          paymentLink: product.paymentLink || '',
          productImage: product.images && product.images.length > 0 ? product.images[0] : undefined
        });

        if (clientEmailSent) {
          logger.info(`✅ Email enviado al cliente: ${email}`);
        } else {
          logger.warn(`⚠️ Email al cliente no pudo ser enviado`);
        }

        // 2. Enviar email al ADMIN con los datos del cliente
        const companySettings = await CompanySettingsModel.getSettings();
        const adminEmail = companySettings?.contactEmail || process.env.SMTP_USER;
        
        if (adminEmail) {
          logger.info(`📧 Enviando email al admin: ${adminEmail}`);
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

          if (adminEmailSent) {
            logger.info(`✅ Email enviado al admin: ${adminEmail}`);
          } else {
            logger.warn(`⚠️ Email al admin no pudo ser enviado`);
          }
        } else {
          logger.warn('⚠️ No se encontró email de admin para enviar notificación');
        }
      } catch (error) {
        logger.error('❌ Error enviando emails:', error);
      }

      logger.info(`📧 Resultado emails - Cliente: ${clientEmailSent}, Admin: ${adminEmailSent}`);

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

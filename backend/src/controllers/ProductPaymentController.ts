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

      // Enviar emails (al cliente y al admin)
      const emailResults = await ProductPaymentController.sendPaymentEmails({
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        customerAddress: address,
        productName: product.name,
        productPrice: product.price,
        quantity,
        total,
        paymentLink: product.paymentLink || '', // Usar string vacío si no hay link
        productImage: product.images && product.images.length > 0 ? product.images[0] : undefined
      });

      if (!emailResults.clientEmailSent) {
        logger.warn('Email al cliente no pudo ser enviado');
      }
      if (!emailResults.adminEmailSent) {
        logger.warn('Email al admin no pudo ser enviado');
      }

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

  /**
   * Enviar emails con información de pago (al cliente y al admin)
   */
  private static async sendPaymentEmails(details: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress: string;
    productName: string;
    productPrice: number;
    quantity: number;
    total: number;
    paymentLink: string;
    productImage?: string;
  }): Promise<{ clientEmailSent: boolean; adminEmailSent: boolean }> {
    let clientEmailSent = false;
    let adminEmailSent = false;

    try {
      // Obtener configuración de la empresa
      const { CompanySettingsModel } = await import('../models/CompanySettings');
      const companySettings = await CompanySettingsModel.getSettings();

      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      
      if (!smtpUser || !smtpPass) {
        logger.warn('SMTP credentials not configured, emails not sent');
        return { clientEmailSent: false, adminEmailSent: false };
      }

      // Convertir URLs relativas a absolutas
      const backendUrl = process.env.BACKEND_URL || process.env.API_URL || 'http://localhost:3000';
      
      let logoUrl = companySettings?.logoUrl;
      if (logoUrl && !logoUrl.startsWith('http')) {
        const relativePath = logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`;
        logoUrl = `${backendUrl}${relativePath}`;
      }

      let productImageUrl = details.productImage;
      if (productImageUrl && !productImageUrl.startsWith('http')) {
        const relativePath = productImageUrl.startsWith('/') ? productImageUrl : `/${productImageUrl}`;
        productImageUrl = `${backendUrl}${relativePath}`;
      }

      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: parseInt(process.env.SMTP_PORT || '587') === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const companyName = companySettings?.companyName || 'Clínica de Belleza';

      // 1. Enviar email al CLIENTE con el link de pago
      try {
        const clientHtml = ProductPaymentController.getClientEmailTemplate({
          ...details,
          productImage: productImageUrl,
          companyName,
          logoUrl
        });

        await transporter.sendMail({
          from: process.env.SMTP_FROM || `"${companyName}" <${smtpUser}>`,
          to: details.customerEmail,
          subject: `🛒 Tu Solicitud de Compra - ${details.productName}`,
          html: clientHtml
        });

        clientEmailSent = true;
        logger.info(`Email enviado al cliente: ${details.customerEmail}`);
      } catch (error) {
        logger.error('Error enviando email al cliente:', error);
      }

      // 2. Enviar email al ADMIN con los datos del cliente
      const companyEmail = companySettings?.contactEmail || smtpUser;
      try {
        const adminHtml = ProductPaymentController.getAdminEmailTemplate({
          ...details,
          productImage: productImageUrl,
          companyName,
          logoUrl
        });

        await transporter.sendMail({
          from: process.env.SMTP_FROM || `"${companyName}" <${smtpUser}>`,
          to: companyEmail,
          subject: `🛒 Nueva Solicitud de Compra - ${details.productName}`,
          html: adminHtml
        });

        adminEmailSent = true;
        logger.info(`Email enviado al admin: ${companyEmail}`);
      } catch (error) {
        logger.error('Error enviando email al admin:', error);
      }

      return { clientEmailSent, adminEmailSent };
    } catch (error) {
      logger.error('Error general enviando emails:', error);
      return { clientEmailSent, adminEmailSent };
    }
  }

  /**
   * Plantilla HTML para email al CLIENTE con link de pago
   */
  private static getClientEmailTemplate(details: {
    customerName: string;
    customerEmail: string;
    productName: string;
    productPrice: number;
    quantity: number;
    total: number;
    paymentLink: string;
    productImage?: string;
    companyName: string;
    logoUrl?: string;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .logo { max-width: 150px; height: auto; margin-bottom: 15px; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .order-box { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea; }
    .product-image { max-width: 200px; height: auto; border-radius: 8px; margin: 15px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
    .detail-label { font-weight: bold; color: #667eea; }
    .total-row { display: flex; justify-content: space-between; padding: 15px 0; font-size: 20px; font-weight: bold; color: #667eea; border-top: 2px solid #667eea; margin-top: 10px; }
    .payment-button { display: inline-block; padding: 15px 40px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; margin: 20px 0; text-align: center; }
    .payment-button:hover { background: #5568d3; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${details.logoUrl ? `<img src="${details.logoUrl}" alt="${details.companyName}" class="logo" />` : ''}
      <h1>¡Gracias por tu Compra!</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${details.customerName}</strong>,</p>
      <p>Hemos recibido tu solicitud de compra. Aquí están los detalles:</p>
      
      <div class="order-box">
        ${details.productImage ? `
        <div style="text-align: center;">
          <img src="${details.productImage}" alt="${details.productName}" class="product-image" />
        </div>
        ` : ''}
        
        <div class="detail-row">
          <span class="detail-label">Producto:</span>
          <span>${details.productName}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Precio Unitario:</span>
          <span>$${details.productPrice.toLocaleString('es-CL')}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Cantidad:</span>
          <span>${details.quantity} unidad${details.quantity > 1 ? 'es' : ''}</span>
        </div>
        
        <div class="total-row">
          <span>TOTAL:</span>
          <span>$${details.total.toLocaleString('es-CL')}</span>
        </div>
      </div>

      ${details.paymentLink ? `
      <div style="text-align: center; margin: 30px 0;">
        <p style="font-size: 16px; margin-bottom: 15px;">
          <strong>Completa tu pago haciendo clic en el siguiente botón:</strong>
        </p>
        <a href="${details.paymentLink}" class="payment-button">
          💳 PAGAR AHORA
        </a>
        <p style="font-size: 14px; color: #666; margin-top: 10px;">
          O copia este link en tu navegador: <br/>
          <a href="${details.paymentLink}" style="color: #667eea; word-break: break-all;">${details.paymentLink}</a>
        </p>
      </div>
      ` : `
      <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; font-size: 16px; color: #856404;">
          <strong>Nos pondremos en contacto contigo pronto para coordinar el pago</strong>
        </p>
      </div>
      `}

      <p style="text-align: center; margin-top: 30px;">
        <strong>¡Gracias por tu preferencia! 😊</strong>
      </p>
    </div>
    <div class="footer">
      <p><strong>${details.companyName}</strong></p>
      <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Plantilla HTML para email al ADMIN con datos del cliente
   */
  private static getAdminEmailTemplate(details: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    productName: string;
    productPrice: number;
    quantity: number;
    total: number;
    paymentLink: string;
    productImage?: string;
    companyName: string;
    logoUrl?: string;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .logo { max-width: 150px; height: auto; margin-bottom: 15px; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .order-box { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea; }
    .product-image { max-width: 200px; height: auto; border-radius: 8px; margin: 15px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
    .detail-label { font-weight: bold; color: #667eea; }
    .total-row { display: flex; justify-content: space-between; padding: 15px 0; font-size: 20px; font-weight: bold; color: #667eea; border-top: 2px solid #667eea; margin-top: 10px; }
    .customer-box { background: #e3f2fd; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .customer-detail { margin: 10px 0; }
    .customer-detail strong { color: #1976d2; display: block; margin-bottom: 5px; }
    .payment-button { display: inline-block; padding: 15px 40px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; margin: 20px 0; text-align: center; }
    .payment-button:hover { background: #5568d3; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .info-box { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${details.logoUrl ? `<img src="${details.logoUrl}" alt="${details.companyName}" class="logo" />` : ''}
      <h1>🛒 Nueva Solicitud de Compra</h1>
    </div>
    <div class="content">
      <p>Has recibido una nueva solicitud de compra de producto.</p>
      
      <div class="order-box">
        <h3 style="margin-top: 0; color: #667eea;">📦 Detalles del Pedido</h3>
        
        ${details.productImage ? `
        <div style="text-align: center;">
          <img src="${details.productImage}" alt="${details.productName}" class="product-image" />
        </div>
        ` : ''}
        
        <div class="detail-row">
          <span class="detail-label">Producto:</span>
          <span>${details.productName}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Precio Unitario:</span>
          <span>$${details.productPrice.toLocaleString('es-CL')}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Cantidad:</span>
          <span>${details.quantity} unidad${details.quantity > 1 ? 'es' : ''}</span>
        </div>
        
        <div class="total-row">
          <span>TOTAL:</span>
          <span>$${details.total.toLocaleString('es-CL')}</span>
        </div>
      </div>

      <div class="customer-box">
        <h3 style="margin-top: 0; color: #1976d2;">👤 Información del Cliente</h3>
        
        <div class="customer-detail">
          <strong>Nombre:</strong>
          ${details.customerName}
        </div>
        
        <div class="customer-detail">
          <strong>Teléfono:</strong>
          <a href="tel:${details.customerPhone}" style="color: #1976d2;">${details.customerPhone}</a>
        </div>
        
        <div class="customer-detail">
          <strong>Dirección de Envío:</strong>
          ${details.customerAddress}
        </div>
      </div>

      ${details.paymentLink ? `
      <div style="text-align: center; margin: 30px 0;">
        <p style="font-size: 16px; margin-bottom: 15px;">
          <strong>Envía el link de pago al cliente:</strong>
        </p>
        <a href="${details.paymentLink}" class="payment-button">
          💳 Ver Link de Pago
        </a>
        <p style="font-size: 14px; color: #666; margin-top: 10px;">
          O copia este link: <br/>
          <a href="${details.paymentLink}" style="color: #667eea; word-break: break-all;">${details.paymentLink}</a>
        </p>
      </div>
      ` : `
      <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; font-size: 16px; color: #856404;">
          <strong>⚠️ Este producto no tiene un link de pago configurado</strong><br/>
          <span style="font-size: 14px;">Contacta al cliente directamente para coordinar el pago</span>
        </p>
      </div>
      `}

      <div class="info-box">
        <strong>📋 Próximos Pasos:</strong>
        <ol style="margin: 10px 0; padding-left: 20px;">
          <li>Contacta al cliente por teléfono o WhatsApp</li>
          <li>Envíale el link de pago</li>
          <li>Una vez confirmado el pago, prepara el envío</li>
          <li>Coordina la entrega a la dirección indicada</li>
        </ol>
      </div>

      <p style="text-align: center; margin-top: 30px; color: #666;">
        <strong>Tiempo estimado de entrega: 3-5 días hábiles</strong>
      </p>
    </div>
    <div class="footer">
      <p><strong>${details.companyName}</strong></p>
      <p>Este es un correo automático generado por una solicitud de compra desde tu sitio web.</p>
    </div>
  </div>
</body>
</html>
    `;
  }
}

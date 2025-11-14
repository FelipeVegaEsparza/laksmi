import nodemailer from 'nodemailer';
import logger from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  /**
   * Inicializar transporter de nodemailer
   */
  private static getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      const port = parseInt(process.env.SMTP_PORT || '587');
      
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: port,
        secure: port === 465, // true para puerto 465 (SSL), false para 587 (STARTTLS) y otros
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        // Opciones adicionales para compatibilidad con diferentes servidores SMTP
        tls: {
          // No fallar en certificados auto-firmados (útil para desarrollo)
          rejectUnauthorized: process.env.NODE_ENV === 'production'
        }
      });

      // Verificar conexión al inicializar (opcional, útil para debugging)
      if (process.env.NODE_ENV === 'development') {
        this.transporter.verify((error, success) => {
          if (error) {
            logger.warn('SMTP connection verification failed:', error.message);
          } else {
            logger.info('SMTP server is ready to send emails');
          }
        });
      }
    }
    return this.transporter;
  }

  /**
   * Enviar email genérico
   */
  private static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        logger.warn('SMTP credentials not configured, email not sent');
        logger.info('Email would be sent to:', options.to);
        logger.info('Subject:', options.subject);
        return false;
      }

      const transporter = this.getTransporter();

      const mailOptions = {
        from: process.env.SMTP_FROM || `"Clínica de Belleza" <${process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.htmlToText(options.html),
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${options.to}: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Enviar código de verificación
   */
  static async sendVerificationCode(
    email: string,
    code: string,
    clientName: string
  ): Promise<boolean> {
    // Obtener configuración de la empresa para el logo
    const { CompanySettingsModel } = await import('../models/CompanySettings');
    const companySettings = await CompanySettingsModel.getSettings();
    
    // Convertir logo URL relativa a absoluta
    if (companySettings?.logoUrl) {
      companySettings.logoUrl = this.getAbsoluteUrl(companySettings.logoUrl);
    }
    
    const html = this.getVerificationCodeTemplate(code, clientName, companySettings);
    
    return await this.sendEmail({
      to: email,
      subject: `🔒 Código de Verificación - ${companySettings?.companyName || 'Clínica de Belleza'}`,
      html,
    });
  }

  /**
   * Enviar confirmación de reserva
   */
  static async sendBookingConfirmation(
    email: string,
    bookingDetails: {
      clientName: string;
      serviceName: string;
      date: Date;
      duration: number;
      price: number;
      professionalName?: string;
      notes?: string;
      status?: string;
      paymentAmount?: number;
      bookingId?: string;
    }
  ): Promise<boolean> {
    // Obtener configuración de la empresa para el logo
    const { CompanySettingsModel } = await import('../models/CompanySettings');
    const companySettings = await CompanySettingsModel.getSettings();
    
    // Convertir logo URL relativa a absoluta
    if (companySettings?.logoUrl) {
      companySettings.logoUrl = this.getAbsoluteUrl(companySettings.logoUrl);
    }
    
    logger.info('Company settings for email:', {
      companyName: companySettings?.companyName,
      logoUrl: companySettings?.logoUrl,
      hasLogo: !!companySettings?.logoUrl,
      paymentLink: companySettings?.paymentLink
    });
    
    const html = this.getBookingConfirmationTemplate(bookingDetails, companySettings);
    
    // Cambiar el asunto según el estado
    const subject = bookingDetails.status === 'pending_payment'
      ? `⚠️ Reserva Pendiente - Confirma tu Pago - ${companySettings?.companyName || 'Clínica de Belleza'}`
      : `✅ Reserva Confirmada - ${companySettings?.companyName || 'Clínica de Belleza'}`;
    
    return await this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Enviar recordatorio de cita (24h antes)
   */
  static async sendBookingReminder(
    email: string,
    bookingDetails: {
      clientName: string;
      serviceName: string;
      date: Date;
      duration: number;
      professionalName?: string;
    }
  ): Promise<boolean> {
    // Obtener configuración de la empresa para el logo
    const { CompanySettingsModel } = await import('../models/CompanySettings');
    const companySettings = await CompanySettingsModel.getSettings();
    
    // Convertir logo URL relativa a absoluta
    if (companySettings?.logoUrl) {
      companySettings.logoUrl = this.getAbsoluteUrl(companySettings.logoUrl);
    }
    
    const html = this.getBookingReminderTemplate(bookingDetails, companySettings);
    
    return await this.sendEmail({
      to: email,
      subject: `⏰ Recordatorio de Cita - Mañana - ${companySettings?.companyName || 'Clínica de Belleza'}`,
      html,
    });
  }

  /**
   * Enviar confirmación de cancelación
   */
  static async sendBookingCancellation(
    email: string,
    bookingDetails: {
      clientName: string;
      serviceName: string;
      date: Date;
      reason?: string;
    }
  ): Promise<boolean> {
    // Obtener configuración de la empresa para el logo
    const { CompanySettingsModel } = await import('../models/CompanySettings');
    const companySettings = await CompanySettingsModel.getSettings();
    
    // Convertir logo URL relativa a absoluta
    if (companySettings?.logoUrl) {
      companySettings.logoUrl = this.getAbsoluteUrl(companySettings.logoUrl);
    }
    
    const html = this.getBookingCancellationTemplate(bookingDetails, companySettings);
    
    return await this.sendEmail({
      to: email,
      subject: `❌ Cancelación de Reserva - ${companySettings?.companyName || 'Clínica de Belleza'}`,
      html,
    });
  }

  /**
   * Enviar mensaje de contacto desde el formulario web
   */
  static async sendContactEmail(
    toEmail: string,
    contactDetails: {
      name: string;
      phone: string;
      email: string;
      subject: string;
      message: string;
    }
  ): Promise<boolean> {
    // Obtener configuración de la empresa
    const { CompanySettingsModel } = await import('../models/CompanySettings');
    const companySettings = await CompanySettingsModel.getSettings();
    
    // Convertir logo URL relativa a absoluta
    if (companySettings?.logoUrl) {
      companySettings.logoUrl = this.getAbsoluteUrl(companySettings.logoUrl);
    }
    
    const html = this.getContactEmailTemplate(contactDetails, companySettings);
    
    return await this.sendEmail({
      to: toEmail,
      subject: `📧 Nuevo Mensaje de Contacto - ${contactDetails.subject}`,
      html,
    });
  }

  /**
   * Plantilla HTML para código de verificación
   */
  private static getVerificationCodeTemplate(code: string, clientName: string, companySettings?: any): string {
    const companyName = companySettings?.companyName || 'Clínica de Belleza';
    const logoUrl = companySettings?.logoUrl;
    
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
    .code-box { background: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
    .code { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace; }
    .info { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" class="logo" />` : ''}
      <h1>🔒 Código de Verificación</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${clientName}</strong>,</p>
      <p>Has solicitado realizar una acción sensible en tu cuenta. Por tu seguridad, necesitamos verificar tu identidad.</p>
      
      <div class="code-box">
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Tu código de verificación es:</p>
        <div class="code">${code}</div>
      </div>

      <div class="info">
        <strong>⏰ Importante:</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Este código expira en <strong>10 minutos</strong></li>
          <li>Solo puedes intentar <strong>3 veces</strong></li>
          <li>No compartas este código con nadie</li>
        </ul>
      </div>

      <p>Si no solicitaste este código, ignora este mensaje y tu cuenta permanecerá segura.</p>
    </div>
    <div class="footer">
      <p><strong>${companyName}</strong></p>
      <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Plantilla HTML para confirmación de reserva
   */
  private static getBookingConfirmationTemplate(details: any, companySettings?: any): string {
    const companyName = companySettings?.companyName || 'Clínica de Belleza';
    const logoUrl = companySettings?.logoUrl;
    const dateStr = new Date(details.date).toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; }
    .logo { max-width: 150px; height: auto; margin-bottom: 15px; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .booking-card { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #11998e; }
    .booking-detail { display: flex; align-items: center; margin: 10px 0; }
    .booking-detail .icon { font-size: 20px; margin-right: 10px; width: 30px; }
    .booking-detail .text { flex: 1; }
    .highlight { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" class="logo" />` : ''}
      <h1>${details.status === 'pending_payment' ? '⚠️ Reserva Pendiente de Confirmación' : '✅ ¡Reserva Confirmada!'}</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${details.clientName}</strong>,</p>
      <p>${details.status === 'pending_payment' 
        ? 'Tu reserva ha sido registrada y está <strong>PENDIENTE DE CONFIRMACIÓN</strong>. Para confirmarla, debes realizar el pago.' 
        : 'Tu reserva ha sido confirmada exitosamente.'} Aquí están los detalles:</p>
      
      <div class="booking-card">
        <div class="booking-detail">
          <div class="icon">💆</div>
          <div class="text"><strong>Servicio:</strong> ${details.serviceName}</div>
        </div>
        <div class="booking-detail">
          <div class="icon">📅</div>
          <div class="text"><strong>Fecha y Hora:</strong> ${dateStr}</div>
        </div>
        <div class="booking-detail">
          <div class="icon">⏱️</div>
          <div class="text"><strong>Duración:</strong> ${details.duration} minutos</div>
        </div>
        <div class="booking-detail">
          <div class="icon">💰</div>
          <div class="text"><strong>Precio:</strong> $${details.price}</div>
        </div>
        ${details.professionalName ? `
        <div class="booking-detail">
          <div class="icon">👤</div>
          <div class="text"><strong>Profesional:</strong> ${details.professionalName}</div>
        </div>
        ` : ''}
        ${details.notes ? `
        <div class="booking-detail">
          <div class="icon">📝</div>
          <div class="text"><strong>Notas:</strong> ${details.notes}</div>
        </div>
        ` : ''}
      </div>

      ${details.status === 'pending_payment' ? `
      <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 25px; margin: 25px 0; text-align: center;">
        <h2 style="margin: 0 0 15px 0; color: #856404;">⚠️ IMPORTANTE: Confirma tu Reserva</h2>
        <p style="margin: 10px 0; font-size: 16px;">Tu reserva está <strong>PENDIENTE</strong> hasta que confirmes el pago</p>
        <p style="margin: 15px 0; font-size: 24px; font-weight: bold; color: #11998e;">Monto a pagar: $${details.paymentAmount?.toLocaleString('es-CL') || '20.000'}</p>
        ${companySettings?.paymentLink ? `
        <a href="${companySettings.paymentLink}" style="display: inline-block; padding: 15px 40px; background: #11998e; color: white; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; margin: 15px 0;">
          🔒 PAGAR AHORA
        </a>
        ` : ''}
        ${companySettings?.paymentInstructions ? `
        <div style="background: white; padding: 15px; border-radius: 5px; margin-top: 15px; text-align: left;">
          <strong>Instrucciones de pago:</strong>
          <p style="margin: 10px 0; white-space: pre-line;">${companySettings.paymentInstructions}</p>
        </div>
        ` : ''}
        <p style="margin: 15px 0; font-size: 14px; color: #856404;">
          Una vez realizado el pago, envíanos el comprobante por WhatsApp o email<br/>
          <strong>Referencia: Reserva #${details.bookingId || ''}</strong>
        </p>
      </div>
      ` : ''}

      <div class="highlight">
        <strong>📌 Recordatorios importantes:</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          ${details.status === 'pending_payment' ? '<li><strong>Tu reserva será confirmada al recibir el pago</strong></li>' : ''}
          <li>Te enviaremos un recordatorio 24 horas antes de tu cita</li>
          <li>Por favor, llega 10 minutos antes de tu hora programada</li>
          <li>Si necesitas cancelar o reagendar, hazlo con al menos 2 horas de anticipación</li>
        </ul>
      </div>

      <p style="text-align: center; margin-top: 30px;">
        <strong>${details.status === 'pending_payment' ? '¡Esperamos tu confirmación! 💳' : '¡Nos vemos pronto! 😊'}</strong>
      </p>
    </div>
    <div class="footer">
      <p><strong>${companyName}</strong></p>
      <p>¿Necesitas ayuda? Contáctanos o responde a este correo.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Plantilla HTML para recordatorio de cita
   */
  private static getBookingReminderTemplate(details: any, companySettings?: any): string {
    const companyName = companySettings?.companyName || 'Clínica de Belleza';
    const logoUrl = companySettings?.logoUrl;
    const dateStr = new Date(details.date).toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; }
    .logo { max-width: 150px; height: auto; margin-bottom: 15px; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .reminder-box { background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
    .time-big { font-size: 48px; font-weight: bold; color: #f5576c; margin: 10px 0; }
    .booking-detail { display: flex; align-items: center; margin: 10px 0; }
    .booking-detail .icon { font-size: 20px; margin-right: 10px; width: 30px; }
    .booking-detail .text { flex: 1; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" class="logo" />` : ''}
      <h1>⏰ Recordatorio de Cita</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${details.clientName}</strong>,</p>
      
      <div class="reminder-box">
        <p style="margin: 0; font-size: 18px;">Tu cita es</p>
        <div class="time-big">MAÑANA</div>
        <p style="margin: 0; font-size: 16px; color: #666;">${dateStr}</p>
      </div>

      <p style="text-align: center; font-size: 18px; margin: 20px 0;">
        <strong>Detalles de tu cita:</strong>
      </p>

      <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <div class="booking-detail">
          <div class="icon">💆</div>
          <div class="text"><strong>Servicio:</strong> ${details.serviceName}</div>
        </div>
        <div class="booking-detail">
          <div class="icon">⏱️</div>
          <div class="text"><strong>Duración:</strong> ${details.duration} minutos</div>
        </div>
        ${details.professionalName ? `
        <div class="booking-detail">
          <div class="icon">👤</div>
          <div class="text"><strong>Profesional:</strong> ${details.professionalName}</div>
        </div>
        ` : ''}
      </div>

      <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <strong>💡 Consejos para tu cita:</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Llega 10 minutos antes</li>
          <li>Trae ropa cómoda</li>
          <li>Si necesitas cancelar, hazlo con al menos 2 horas de anticipación</li>
        </ul>
      </div>

      <p style="text-align: center; margin-top: 30px;">
        <strong>¡Te esperamos! 😊</strong>
      </p>
    </div>
    <div class="footer">
      <p><strong>${companyName}</strong></p>
      <p>¿Necesitas reagendar? Contáctanos lo antes posible.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Plantilla HTML para cancelación de reserva
   */
  private static getBookingCancellationTemplate(details: any, companySettings?: any): string {
    const companyName = companySettings?.companyName || 'Clínica de Belleza';
    const logoUrl = companySettings?.logoUrl;
    const dateStr = new Date(details.date).toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #868f96 0%, #596164 100%); color: white; padding: 30px; text-align: center; }
    .logo { max-width: 150px; height: auto; margin-bottom: 15px; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .cancelled-box { background: #f8d7da; border: 2px solid #dc3545; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .booking-detail { display: flex; align-items: center; margin: 10px 0; }
    .booking-detail .icon { font-size: 20px; margin-right: 10px; width: 30px; }
    .booking-detail .text { flex: 1; }
    .info-box { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196f3; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" class="logo" />` : ''}
      <h1>❌ Reserva Cancelada</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${details.clientName}</strong>,</p>
      <p>Tu reserva ha sido cancelada exitosamente.</p>
      
      <div class="cancelled-box">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: #721c24;">Reserva cancelada:</p>
        <div class="booking-detail">
          <div class="icon">💆</div>
          <div class="text"><strong>Servicio:</strong> ${details.serviceName}</div>
        </div>
        <div class="booking-detail">
          <div class="icon">📅</div>
          <div class="text"><strong>Fecha y Hora:</strong> ${dateStr}</div>
        </div>
        ${details.reason ? `
        <div class="booking-detail">
          <div class="icon">📝</div>
          <div class="text"><strong>Motivo:</strong> ${details.reason}</div>
        </div>
        ` : ''}
      </div>

      <div class="info-box">
        <strong>💙 ¿Quieres reagendar?</strong>
        <p style="margin: 10px 0 0 0;">Estaremos encantados de atenderte en otra fecha. Puedes hacer una nueva reserva cuando lo desees a través de nuestro chatbot o contactándonos directamente.</p>
      </div>

      <p style="text-align: center; margin-top: 30px;">
        <strong>¡Esperamos verte pronto! 😊</strong>
      </p>
    </div>
    <div class="footer">
      <p><strong>${companyName}</strong></p>
      <p>¿Necesitas ayuda? Contáctanos o responde a este correo.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Plantilla HTML para mensaje de contacto
   */
  private static getContactEmailTemplate(details: any, companySettings?: any): string {
    const companyName = companySettings?.companyName || 'Clínica de Belleza';
    const logoUrl = companySettings?.logoUrl;

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
    .contact-box { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea; }
    .contact-detail { margin: 15px 0; }
    .contact-detail strong { color: #667eea; display: block; margin-bottom: 5px; }
    .message-box { background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" class="logo" />` : ''}
      <h1>📧 Nuevo Mensaje de Contacto</h1>
    </div>
    <div class="content">
      <p>Has recibido un nuevo mensaje desde el formulario de contacto de tu sitio web.</p>
      
      <div class="contact-box">
        <h3 style="margin-top: 0; color: #667eea;">Información del Contacto</h3>
        
        <div class="contact-detail">
          <strong>👤 Nombre:</strong>
          ${details.name}
        </div>
        
        <div class="contact-detail">
          <strong>📧 Email:</strong>
          <a href="mailto:${details.email}" style="color: #667eea;">${details.email}</a>
        </div>
        
        <div class="contact-detail">
          <strong>📱 Teléfono:</strong>
          <a href="tel:${details.phone}" style="color: #667eea;">${details.phone}</a>
        </div>
        
        <div class="contact-detail">
          <strong>📋 Asunto:</strong>
          ${details.subject}
        </div>
      </div>

      <div class="message-box">
        <strong style="display: block; margin-bottom: 10px; color: #856404;">💬 Mensaje:</strong>
        <p style="margin: 0; white-space: pre-line;">${details.message}</p>
      </div>

      <p style="text-align: center; margin-top: 30px; color: #666;">
        <strong>Responde a este mensaje lo antes posible para brindar un excelente servicio al cliente.</strong>
      </p>
    </div>
    <div class="footer">
      <p><strong>${companyName}</strong></p>
      <p>Este es un mensaje automático del formulario de contacto de tu sitio web.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Convertir HTML simple a texto plano
   */
  private static htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Convertir URL relativa a absoluta
   */
  private static getAbsoluteUrl(url: string): string {
    // Si ya es una URL absoluta, devolverla tal cual
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Obtener la URL base del backend desde las variables de entorno
    const backendUrl = process.env.BACKEND_URL || process.env.API_URL || 'http://localhost:3000';
    
    // Asegurar que la URL relativa empiece con /
    const relativePath = url.startsWith('/') ? url : `/${url}`;
    
    return `${backendUrl}${relativePath}`;
  }

  /**
   * Verificar configuración de email
   */
  static isConfigured(): boolean {
    return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
  }
}

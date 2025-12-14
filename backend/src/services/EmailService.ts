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
      const host = process.env.SMTP_HOST || 'smtp.gmail.com';
      
      console.log('📧 Creating SMTP transporter with config:', {
        host,
        port,
        secure: port === 465,
        user: process.env.SMTP_USER ? 'SET' : 'NOT SET'
      });
      
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true para puerto 465 (SSL), false para 587 (STARTTLS) y otros
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        // Opciones adicionales para compatibilidad con diferentes servidores SMTP
        connectionTimeout: 60000, // 60 segundos (aumentado desde default de 2 min)
        greetingTimeout: 30000, // 30 segundos
        socketTimeout: 60000, // 60 segundos
        tls: {
          // No fallar en certificados auto-firmados (útil para desarrollo)
          rejectUnauthorized: process.env.NODE_ENV === 'production',
          // Permitir conexiones TLS menos seguras si es necesario
          minVersion: 'TLSv1' as const
        },
        // Configuración adicional para Gmail y otros proveedores
        pool: false, // No usar pool de conexiones
        maxConnections: 1,
        maxMessages: 1
      } as any);

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
   * Enviar email genérico con reintentos
   */
  private static async sendEmail(options: EmailOptions, retries = 3): Promise<boolean> {
    console.log('📧 sendEmail called');
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`📧 Attempt ${attempt}/${retries}`);
        console.log('📧 Checking SMTP credentials...');
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;
        const smtpHost = process.env.SMTP_HOST;
        const smtpPort = process.env.SMTP_PORT;
        
        console.log('📧 SMTP Configuration:', {
          host: smtpHost || 'smtp.gmail.com',
          port: smtpPort || '587',
          user: smtpUser ? 'SET' : 'NOT SET',
          pass: smtpPass ? 'SET' : 'NOT SET'
        });
        
        if (!smtpUser || !smtpPass) {
          console.warn('⚠️ SMTP credentials not configured, email not sent');
          console.log('📧 Email would be sent to:', options.to);
          console.log('📧 Subject:', options.subject);
          return false;
        }
        
        console.log('✅ SMTP credentials are configured');

        console.log('📧 Getting transporter...');
        const transporter = this.getTransporter();
        console.log('📧 Transporter obtained');

        const mailOptions = {
          from: process.env.SMTP_FROM || `"Clínica de Belleza" <${process.env.SMTP_USER}>`,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text || this.htmlToText(options.html),
        };

        console.log('📧 Sending email...');
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully to ${options.to}: ${info.messageId}`);
        return true;
      } catch (error: any) {
        console.error(`❌ Error sending email (attempt ${attempt}/${retries}):`, {
          code: error.code,
          command: error.command,
          message: error.message,
          response: error.response
        });
        
        // Si es el último intento, fallar
        if (attempt === retries) {
          console.error('❌ All email sending attempts failed');
          
          // Log detallado del error para debugging
          if (error.code === 'ETIMEDOUT') {
            console.error('⚠️ SMTP Connection Timeout - Possible causes:');
            console.error('  1. Firewall blocking outbound SMTP connections');
            console.error('  2. SMTP server not reachable from container');
            console.error('  3. Incorrect SMTP host or port');
            console.error('  4. Network restrictions in hosting environment');
            console.error('💡 Suggestion: Use a dedicated email service like Resend, SendGrid, or Mailgun');
          } else if (error.code === 'EAUTH') {
            console.error('⚠️ SMTP Authentication Failed - Check credentials');
          } else if (error.code === 'ECONNECTION') {
            console.error('⚠️ SMTP Connection Failed - Check host and port');
          }
          
          return false;
        }
        
        // Esperar antes de reintentar (backoff exponencial)
        const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Resetear transporter para forzar nueva conexión
        this.transporter = null;
      }
    }
    
    return false;
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
    console.log('📧 sendBookingConfirmation called with email:', email);
    try {
      // Obtener configuración de la empresa para el logo
      console.log('📧 Importing CompanySettingsModel...');
      const { CompanySettingsModel } = await import('../models/CompanySettings');
      console.log('📧 Getting company settings...');
      const companySettings = await CompanySettingsModel.getSettings();
      console.log('📧 Company settings retrieved');
    
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
    
      console.log('📧 Generating email template...');
      const html = this.getBookingConfirmationTemplate(bookingDetails, companySettings);
      console.log('📧 Template generated');
      
      // Cambiar el asunto según el estado
      const subject = bookingDetails.status === 'pending_payment'
        ? `⚠️ Reserva Pendiente - Confirma tu Pago - ${companySettings?.companyName || 'Clínica de Belleza'}`
        : `✅ Reserva Confirmada - ${companySettings?.companyName || 'Clínica de Belleza'}`;
      
      console.log('📧 Calling sendEmail with subject:', subject);
      const result = await this.sendEmail({
        to: email,
        subject,
        html,
      });
      console.log('📧 sendEmail result:', result);
      return result;
    } catch (error) {
      console.error('❌ Error in sendBookingConfirmation:', error);
      return false;
    }
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
    const dateStr = new Date(details.date).toLocaleString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Santiago'
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
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0; font-size: 14px; color: #666;">Precio total del servicio:</p>
          <p style="margin: 5px 0; font-size: 20px; font-weight: bold; color: #333;">$${(details.price || 0).toLocaleString('es-CL')}</p>
          
          <div style="border-top: 2px dashed #ffc107; margin: 15px 0; padding-top: 15px;">
            <p style="margin: 5px 0; font-size: 14px; color: #666;">Pago adelantado para confirmar (Evaluación):</p>
            <p style="margin: 5px 0; font-size: 28px; font-weight: bold; color: #11998e;">$20.000</p>
          </div>
          
          <p style="margin: 15px 0 5px 0; font-size: 14px; color: #666;">Saldo a pagar en el centro:</p>
          <p style="margin: 5px 0; font-size: 20px; font-weight: bold; color: #333;">$${((details.price || 0) - 20000).toLocaleString('es-CL')}</p>
        </div>
        ${companySettings?.paymentLink ? `
        <a href="${companySettings.paymentLink}" style="display: inline-block; padding: 15px 40px; background: #11998e; color: white; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; margin: 15px 0;">
          🔒 PAGAR $20.000 AHORA
        </a>
        ` : ''}
        ${companySettings?.paymentInstructions ? `
        <div style="background: white; padding: 15px; border-radius: 5px; margin-top: 15px; text-align: left;">
          <strong>Instrucciones de pago:</strong>
          <p style="margin: 10px 0; white-space: pre-line;">${companySettings.paymentInstructions}</p>
        </div>
        ` : ''}
        <p style="margin: 15px 0; font-size: 14px; color: #856404;">
          Una vez realizado el pago de $20.000, envíanos el comprobante por WhatsApp o email<br/>
          <strong>Referencia: Reserva #${details.bookingId || ''}</strong>
        </p>
        <p style="margin: 10px 0; font-size: 13px; color: #666; font-style: italic;">
          * El saldo restante se cancela en el centro de estética el día de tu cita
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
    const dateStr = new Date(details.date).toLocaleString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Santiago'
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
    const dateStr = new Date(details.date).toLocaleString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Santiago'
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
   * Enviar email de solicitud de pago de producto al cliente
   */
  static async sendProductPaymentToClient(
    email: string,
    productDetails: {
      customerName: string;
      productName: string;
      productPrice: number;
      quantity: number;
      total: number;
      paymentLink: string;
      productImage?: string;
    }
  ): Promise<boolean> {
    console.log('📧 sendProductPaymentToClient called with email:', email);
    try {
      // Obtener configuración de la empresa para el logo
      console.log('📧 Importing CompanySettingsModel...');
      const { CompanySettingsModel } = await import('../models/CompanySettings');
      console.log('📧 Getting company settings...');
      const companySettings = await CompanySettingsModel.getSettings();
      console.log('📧 Company settings retrieved');
    
      // Convertir logo URL relativa a absoluta
      if (companySettings?.logoUrl) {
        companySettings.logoUrl = this.getAbsoluteUrl(companySettings.logoUrl);
      }

      // Convertir imagen del producto a URL absoluta
      let productImageUrl = productDetails.productImage;
      if (productImageUrl && !productImageUrl.startsWith('http')) {
        productImageUrl = this.getAbsoluteUrl(productImageUrl);
      }
      
      console.log('📧 Generating email template...');
      const html = this.getProductPaymentClientTemplate({
        ...productDetails,
        productImage: productImageUrl,
        companyName: companySettings?.companyName || 'Clínica de Belleza',
        logoUrl: companySettings?.logoUrl
      });
      console.log('📧 Template generated');
      
      const subject = `🛒 Tu Solicitud de Compra - ${productDetails.productName}`;
      
      console.log('📧 Calling sendEmail with subject:', subject);
      const result = await this.sendEmail({
        to: email,
        subject,
        html,
      });
      console.log('📧 sendEmail result:', result);
      return result;
    } catch (error) {
      console.error('❌ Error in sendProductPaymentToClient:', error);
      return false;
    }
  }

  /**
   * Enviar email de solicitud de pago de producto al admin
   */
  static async sendProductPaymentToAdmin(
    email: string,
    productDetails: {
      customerName: string;
      customerPhone: string;
      customerAddress: string;
      productName: string;
      productPrice: number;
      quantity: number;
      total: number;
      paymentLink: string;
      productImage?: string;
    }
  ): Promise<boolean> {
    console.log('📧 sendProductPaymentToAdmin called with email:', email);
    try {
      // Obtener configuración de la empresa para el logo
      console.log('📧 Importing CompanySettingsModel...');
      const { CompanySettingsModel } = await import('../models/CompanySettings');
      console.log('📧 Getting company settings...');
      const companySettings = await CompanySettingsModel.getSettings();
      console.log('📧 Company settings retrieved');
    
      // Convertir logo URL relativa a absoluta
      if (companySettings?.logoUrl) {
        companySettings.logoUrl = this.getAbsoluteUrl(companySettings.logoUrl);
      }

      // Convertir imagen del producto a URL absoluta
      let productImageUrl = productDetails.productImage;
      if (productImageUrl && !productImageUrl.startsWith('http')) {
        productImageUrl = this.getAbsoluteUrl(productImageUrl);
      }
      
      console.log('📧 Generating email template...');
      const html = this.getProductPaymentAdminTemplate({
        ...productDetails,
        productImage: productImageUrl,
        companyName: companySettings?.companyName || 'Clínica de Belleza',
        logoUrl: companySettings?.logoUrl
      });
      console.log('📧 Template generated');
      
      const subject = `🛒 Nueva Solicitud de Compra - ${productDetails.productName}`;
      
      console.log('📧 Calling sendEmail with subject:', subject);
      const result = await this.sendEmail({
        to: email,
        subject,
        html,
      });
      console.log('📧 sendEmail result:', result);
      return result;
    } catch (error) {
      console.error('❌ Error in sendProductPaymentToAdmin:', error);
      return false;
    }
  }

  /**
   * Plantilla HTML para email al CLIENTE con link de pago de producto
   */
  private static getProductPaymentClientTemplate(details: {
    customerName: string;
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
   * Plantilla HTML para email al ADMIN con datos del cliente de producto
   */
  private static getProductPaymentAdminTemplate(details: {
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
          <strong>Link de pago enviado al cliente:</strong>
        </p>
        <a href="${details.paymentLink}" class="payment-button">
          💳 Ver Link de Pago
        </a>
        <p style="font-size: 14px; color: #666; margin-top: 10px;">
          Link: <br/>
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
          <li>Confirma que recibió el link de pago</li>
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

  /**
   * Verificar configuración de email
   */
  static isConfigured(): boolean {
    return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
  }
}

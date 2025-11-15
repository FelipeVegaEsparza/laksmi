import twilio from 'twilio';
import crypto from 'crypto';
import config from '../config';
import logger from '../utils/logger';

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  webhookUrl: string;
  validateSignatures: boolean;
}

export interface WhatsAppMessage {
  to: string;
  body: string;
  mediaUrl?: string;
  templateName?: string;
  templateData?: Record<string, string>;
}

export interface TwilioWebhookPayload {
  MessageSid: string;
  From: string;
  To: string;
  Body: string;
  MediaUrl0?: string;
  MediaContentType0?: string;
  NumMedia: string;
  ProfileName?: string;
  WaId?: string;
  SmsStatus?: string;
  AccountSid: string;
  ApiVersion: string;
}

export class TwilioService {
  private static client: twilio.Twilio;
  private static config: TwilioConfig = {
    accountSid: config.twilio?.accountSid || '',
    authToken: config.twilio?.authToken || '',
    phoneNumber: config.twilio?.phoneNumber || '',
    webhookUrl: config.twilio?.webhookUrl || '',
    validateSignatures: config.twilio?.validateSignatures !== false
  };

  private static rateLimitMap = new Map<string, { count: number; resetTime: number }>();
  private static readonly RATE_LIMIT_PER_MINUTE = 10;
  private static readonly RETRY_ATTEMPTS = 3;
  private static readonly RETRY_DELAY = 1000; // 1 segundo

  /**
   * Inicializar cliente de Twilio
   */
  static initialize(): void {
    // Check if Twilio credentials are properly configured
    if (!this.config.accountSid || 
        !this.config.authToken || 
        this.config.accountSid === 'dummy_account_sid' ||
        this.config.authToken === 'dummy_auth_token' ||
        !this.config.accountSid.startsWith('AC')) {
      logger.warn('Twilio credentials not configured or using dummy values. WhatsApp functionality will be disabled.');
      return;
    }

    try {
      this.client = twilio(this.config.accountSid, this.config.authToken);
      logger.info('Twilio client initialized successfully');
    } catch (error) {
      logger.error('Error initializing Twilio client:', error);
      logger.warn('Continuing without Twilio - WhatsApp functionality will be disabled');
      // Don't throw error, just continue without Twilio
      return;
    }
  }

  /**
   * Validar signature de webhook de Twilio
   */
  static validateWebhookSignature(
    signature: string,
    url: string,
    params: Record<string, any>
  ): boolean {
    if (!this.config.validateSignatures) {
      logger.warn('Webhook signature validation is disabled');
      return true;
    }

    if (!signature) {
      logger.error('Missing Twilio signature header');
      return false;
    }

    try {
      return twilio.validateRequest(
        this.config.authToken,
        signature,
        url,
        params
      );
    } catch (error) {
      logger.error('Error validating Twilio signature:', error);
      return false;
    }
  }

  /**
   * Enviar mensaje de WhatsApp
   */
  static async sendWhatsAppMessage(message: WhatsAppMessage): Promise<{
    success: boolean;
    messageSid?: string;
    error?: string;
  }> {
    if (!this.client) {
      return {
        success: false,
        error: 'Twilio client not initialized'
      };
    }

    // Verificar rate limiting
    if (!this.checkRateLimit(message.to)) {
      return {
        success: false,
        error: 'Rate limit exceeded for this number'
      };
    }

    // Formatear número de teléfono
    const formattedTo = this.formatPhoneNumber(message.to);
    const formattedFrom = this.formatPhoneNumber(this.config.phoneNumber);

    let attempt = 0;
    while (attempt < this.RETRY_ATTEMPTS) {
      try {
        const messageOptions: any = {
          from: `whatsapp:${formattedFrom}`,
          to: `whatsapp:${formattedTo}`,
          body: message.body
        };

        // Agregar media si está presente
        if (message.mediaUrl) {
          messageOptions.mediaUrl = [message.mediaUrl];
        }

        const twilioMessage = await this.client.messages.create(messageOptions);

        logger.info(`WhatsApp message sent successfully: ${twilioMessage.sid}`, {
          to: formattedTo,
          messageLength: message.body.length,
          hasMedia: !!message.mediaUrl
        });

        return {
          success: true,
          messageSid: twilioMessage.sid
        };

      } catch (error: any) {
        attempt++;
        logger.error(`Attempt ${attempt} failed to send WhatsApp message:`, {
          error: error.message,
          code: error.code,
          to: formattedTo
        });

        if (attempt >= this.RETRY_ATTEMPTS) {
          return {
            success: false,
            error: `Failed after ${this.RETRY_ATTEMPTS} attempts: ${error.message}`
          };
        }

        // Esperar antes del siguiente intento
        await this.delay(this.RETRY_DELAY * attempt);
      }
    }

    return {
      success: false,
      error: 'Unexpected error in retry loop'
    };
  }

  /**
   * Enviar plantilla de WhatsApp Business
   */
  static async sendWhatsAppTemplate(
    to: string,
    templateName: string,
    templateData: Record<string, string> = {}
  ): Promise<{
    success: boolean;
    messageSid?: string;
    error?: string;
  }> {
    if (!this.client) {
      return {
        success: false,
        error: 'Twilio client not initialized'
      };
    }

    // Verificar rate limiting
    if (!this.checkRateLimit(to)) {
      return {
        success: false,
        error: 'Rate limit exceeded for this number'
      };
    }

    try {
      const formattedTo = this.formatPhoneNumber(to);
      const formattedFrom = this.formatPhoneNumber(this.config.phoneNumber);

      // Intentar enviar como plantilla aprobada de WhatsApp Business
      let message;
      try {
        // Construir parámetros de la plantilla
        const templateParameters = Object.values(templateData);

        message = await this.client.messages.create({
          from: `whatsapp:${formattedFrom}`,
          to: `whatsapp:${formattedTo}`,
          contentSid: templateName, // En Twilio, las plantillas usan contentSid
          contentVariables: JSON.stringify(templateData)
        });

        logger.info(`WhatsApp Business template sent successfully: ${message.sid}`, {
          to: formattedTo,
          template: templateName,
          parameters: templateParameters.length,
          method: 'business_template'
        });

      } catch (templateError: any) {
        // Si falla el envío como plantilla, intentar como mensaje regular
        logger.warn(`Business template failed, falling back to regular message: ${templateError.message}`);
        
        // Obtener el contenido renderizado de la plantilla
        const { WhatsAppTemplateService } = await import('./WhatsAppTemplateService');
        const renderedContent = WhatsAppTemplateService.renderTemplateContent(templateName, templateData);
        
        message = await this.client.messages.create({
          from: `whatsapp:${formattedFrom}`,
          to: `whatsapp:${formattedTo}`,
          body: renderedContent
        });

        logger.info(`WhatsApp message sent as fallback: ${message.sid}`, {
          to: formattedTo,
          template: templateName,
          method: 'regular_message_fallback'
        });
      }

      return {
        success: true,
        messageSid: message.sid
      };

    } catch (error: any) {
      logger.error('Error sending WhatsApp template:', {
        error: error.message,
        code: error.code,
        to,
        template: templateName
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Procesar webhook de Twilio
   */
  static processWebhookPayload(payload: TwilioWebhookPayload): {
    phoneNumber: string;
    message: string;
    mediaUrl?: string;
    mediaType?: string;
    profileName?: string;
    messageSid: string;
    isStatusUpdate: boolean;
  } {
    const phoneNumber = this.extractPhoneNumber(payload.From);
    const isStatusUpdate = !!payload.SmsStatus && !payload.Body;

    return {
      phoneNumber,
      message: payload.Body || '',
      mediaUrl: payload.MediaUrl0,
      mediaType: payload.MediaContentType0,
      profileName: payload.ProfileName,
      messageSid: payload.MessageSid,
      isStatusUpdate
    };
  }

  /**
   * Obtener estado de mensaje
   */
  static async getMessageStatus(messageSid: string): Promise<{
    status: string;
    errorCode?: string;
    errorMessage?: string;
  } | null> {
    if (!this.client) {
      return null;
    }

    try {
      const message = await this.client.messages(messageSid).fetch();
      
      return {
        status: message.status,
        errorCode: message.errorCode?.toString(),
        errorMessage: message.errorMessage
      };
    } catch (error: any) {
      logger.error(`Error fetching message status for ${messageSid}:`, error);
      return null;
    }
  }

  /**
   * Obtener plantillas disponibles
   */
  static async getAvailableTemplates(): Promise<Array<{
    sid: string;
    friendlyName: string;
    language: string;
    status: string;
  }>> {
    if (!this.client) {
      return [];
    }

    try {
      const templates = await this.client.content.contents.list({
        limit: 50
      });

      return templates.map(template => ({
        sid: template.sid,
        friendlyName: template.friendlyName,
        language: template.language,
        status: 'approved' // Simplificado por ahora
      }));
    } catch (error: any) {
      logger.error('Error fetching WhatsApp templates:', error);
      return [];
    }
  }

  /**
   * Verificar conectividad con Twilio
   */
  static async testConnection(): Promise<{
    success: boolean;
    accountInfo?: any;
    error?: string;
  }> {
    logger.info('Testing Twilio connection...', {
      hasClient: !!this.client,
      accountSid: this.config.accountSid?.substring(0, 10) + '...',
      hasAuthToken: !!this.config.authToken
    });

    if (!this.client) {
      logger.error('Twilio client not initialized');
      return {
        success: false,
        error: 'Twilio client not initialized'
      };
    }

    try {
      logger.info('Fetching Twilio account info...');
      const account = await this.client.api.accounts(this.config.accountSid).fetch();
      
      logger.info('Twilio account fetched successfully', {
        sid: account.sid,
        friendlyName: account.friendlyName,
        status: account.status
      });

      return {
        success: true,
        accountInfo: {
          sid: account.sid,
          friendlyName: account.friendlyName,
          status: account.status,
          type: account.type
        }
      };
    } catch (error: any) {
      logger.error('Twilio connection test failed:', {
        error: error.message,
        code: error.code,
        status: error.status,
        moreInfo: error.moreInfo
      });
      return {
        success: false,
        error: `${error.message} (Code: ${error.code || 'unknown'})`
      };
    }
  }

  // Métodos privados

  private static formatPhoneNumber(phoneNumber: string): string {
    // Remover espacios y caracteres especiales
    let formatted = phoneNumber.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    
    // Agregar código de país si no está presente
    if (!formatted.startsWith('+')) {
      if (formatted.startsWith('1')) {
        formatted = '+' + formatted;
      } else {
        formatted = '+1' + formatted; // Asumir US por defecto
      }
    }
    
    return formatted;
  }

  private static extractPhoneNumber(twilioFrom: string): string {
    return twilioFrom.replace('whatsapp:', '').replace(/\s+/g, '');
  }

  private static checkRateLimit(phoneNumber: string): boolean {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minuto
    
    const limit = this.rateLimitMap.get(phoneNumber);
    
    if (!limit || now > limit.resetTime) {
      this.rateLimitMap.set(phoneNumber, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }

    if (limit.count >= this.RATE_LIMIT_PER_MINUTE) {
      return false;
    }

    limit.count++;
    return true;
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtener configuración actual
   */
  static getConfig(): Omit<TwilioConfig, 'authToken'> {
    return {
      accountSid: this.config.accountSid,
      phoneNumber: this.config.phoneNumber,
      webhookUrl: this.config.webhookUrl,
      validateSignatures: this.config.validateSignatures
    };
  }

  /**
   * Actualizar configuración
   */
  static updateConfig(newConfig: Partial<TwilioConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reinicializar cliente si las credenciales cambiaron
    if (newConfig.accountSid || newConfig.authToken) {
      this.initialize();
    }
    
    logger.info('Twilio configuration updated');
  }

  /**
   * Obtener estadísticas de uso
   */
  static getUsageStats(): {
    activeRateLimits: number;
    totalMessagesSent: number;
    rateLimitsByNumber: Record<string, number>;
  } {
    // Limpiar rate limits expirados
    const now = Date.now();
    for (const [phoneNumber, limit] of this.rateLimitMap.entries()) {
      if (now > limit.resetTime) {
        this.rateLimitMap.delete(phoneNumber);
      }
    }

    const rateLimitsByNumber: Record<string, number> = {};
    let totalMessagesSent = 0;

    for (const [phoneNumber, limit] of this.rateLimitMap.entries()) {
      rateLimitsByNumber[phoneNumber] = limit.count;
      totalMessagesSent += limit.count;
    }

    return {
      activeRateLimits: this.rateLimitMap.size,
      totalMessagesSent,
      rateLimitsByNumber
    };
  }

  /**
   * Limpiar rate limits expirados
   */
  static cleanupRateLimits(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [phoneNumber, limit] of this.rateLimitMap.entries()) {
      if (now > limit.resetTime) {
        this.rateLimitMap.delete(phoneNumber);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} expired rate limits`);
    }

    return cleanedCount;
  }
}
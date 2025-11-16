import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { CompanySettingsModel } from '../models/CompanySettings';
import { TwilioService } from '../services/TwilioService';
import logger from '../utils/logger';

export class SettingsController {
  /**
   * Obtener configuración de Twilio
   */
  static async getTwilioConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const settings = await CompanySettingsModel.getSettings();

      if (!settings) {
        res.json({
          success: true,
          data: {
            accountSid: '',
            authToken: '',
            phoneNumber: '',
            webhookUrl: '',
            isConfigured: false,
          }
        });
        return;
      }

      res.json({
        success: true,
        data: {
          accountSid: settings.twilioAccountSid || '',
          authToken: settings.twilioAuthToken || '',
          phoneNumber: settings.twilioPhoneNumber || '',
          webhookUrl: settings.twilioWebhookUrl || '',
          isConfigured: !!(settings.twilioAccountSid && settings.twilioAuthToken && settings.twilioPhoneNumber),
        }
      });
    } catch (error: any) {
      logger.error('Get Twilio config error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener configuración de Twilio'
      });
    }
  }

  /**
   * Actualizar configuración de Twilio
   */
  static async updateTwilioConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { accountSid, authToken, phoneNumber, webhookUrl } = req.body;

      const settings = await CompanySettingsModel.updateSettings({
        twilioAccountSid: accountSid,
        twilioAuthToken: authToken,
        twilioPhoneNumber: phoneNumber,
        twilioWebhookUrl: webhookUrl,
        twilioValidateSignatures: true,
      });

      if (!settings) {
        res.status(500).json({
          success: false,
          error: 'Error al actualizar configuración de Twilio'
        });
        return;
      }

      // Actualizar configuración de TwilioService
      TwilioService.updateConfig({
        accountSid: accountSid || '',
        authToken: authToken || '',
        phoneNumber: phoneNumber || '',
        webhookUrl: webhookUrl || '',
        validateSignatures: true,
      });

      res.json({
        success: true,
        message: 'Configuración de Twilio actualizada exitosamente',
        data: {
          accountSid: settings.twilioAccountSid || '',
          authToken: settings.twilioAuthToken || '',
          phoneNumber: settings.twilioPhoneNumber || '',
          webhookUrl: settings.twilioWebhookUrl || '',
          isConfigured: !!(settings.twilioAccountSid && settings.twilioAuthToken && settings.twilioPhoneNumber),
        }
      });
    } catch (error: any) {
      logger.error('Update Twilio config error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al actualizar configuración de Twilio'
      });
    }
  }

  /**
   * Probar conexión de Twilio
   */
  static async testTwilioConnection(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const settings = await CompanySettingsModel.getSettings();

      if (!settings || !settings.twilioAccountSid || !settings.twilioAuthToken) {
        res.json({
          success: false,
          data: {
            connected: false,
            message: 'Configuración de Twilio incompleta'
          }
        });
        return;
      }

      // Actualizar configuración de TwilioService con los datos guardados
      logger.info('Updating TwilioService config for test...', {
        accountSid: settings.twilioAccountSid?.substring(0, 10) + '...',
        hasAuthToken: !!settings.twilioAuthToken,
        phoneNumber: settings.twilioPhoneNumber
      });
      
      TwilioService.updateConfig({
        accountSid: settings.twilioAccountSid,
        authToken: settings.twilioAuthToken,
        phoneNumber: settings.twilioPhoneNumber || '',
        webhookUrl: settings.twilioWebhookUrl || '',
        validateSignatures: settings.twilioValidateSignatures !== false,
      });

      // Probar conexión real con Twilio
      logger.info('Testing Twilio connection...');
      const testResult = await TwilioService.testConnection();
      logger.info('Twilio test result:', testResult);
      
      if (testResult.success) {
        res.json({
          success: true,
          data: {
            connected: true,
            message: `Conectado exitosamente a Twilio (${testResult.accountInfo?.friendlyName || 'Account'})`,
            accountInfo: testResult.accountInfo
          }
        });
      } else {
        res.json({
          success: false,
          data: {
            connected: false,
            message: testResult.error || 'Error al conectar con Twilio'
          }
        });
      }
    } catch (error: any) {
      logger.error('Test Twilio connection error:', error);
      res.json({
        success: false,
        data: {
          connected: false,
          message: error.message || 'Error al probar conexión'
        }
      });
    }
  }

  /**
   * Enviar mensaje de prueba
   */
  static async testTwilioMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      logger.info('📱 Test message request received', { body: req.body });
      
      const { testPhoneNumber } = req.body;

      if (!testPhoneNumber) {
        logger.warn('⚠️  No phone number provided for test');
        res.status(400).json({
          success: false,
          error: 'Número de teléfono requerido'
        });
        return;
      }

      logger.info('📤 Sending test WhatsApp message...', { to: testPhoneNumber });

      // Intentar enviar un mensaje de prueba
      const result = await TwilioService.sendWhatsAppMessage({
        to: testPhoneNumber,
        body: '¡Hola! Este es un mensaje de prueba desde Laksmi. Tu configuración de Twilio está funcionando correctamente. 🎉'
      });

      logger.info('📬 Test message result:', { 
        success: result.success, 
        messageSid: result.messageSid,
        error: result.error 
      });

      res.json({
        success: result.success,
        data: {
          success: result.success,
          message: result.success 
            ? 'Mensaje de prueba enviado exitosamente' 
            : result.error || 'Error al enviar mensaje de prueba'
        }
      });
    } catch (error: any) {
      logger.error('❌ Test Twilio message error:', {
        error: error.message,
        stack: error.stack,
        code: error.code
      });
      
      res.status(500).json({
        success: false,
        error: error.message || 'Error al enviar mensaje de prueba',
        data: {
          success: false,
          message: error.message || 'Error al enviar mensaje de prueba'
        }
      });
    }
  }

  /**
   * Obtener plantillas de WhatsApp
   */
  static async getWhatsAppTemplates(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Por ahora retornamos un array vacío
      // En el futuro se puede implementar la integración con Twilio Content API
      res.json({
        success: true,
        data: []
      });
    } catch (error: any) {
      logger.error('Get WhatsApp templates error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener plantillas'
      });
    }
  }
}

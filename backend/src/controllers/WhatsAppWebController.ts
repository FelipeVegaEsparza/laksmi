import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { WhatsAppWebService } from '../services/WhatsAppWebService';
import logger from '../utils/logger';

export class WhatsAppWebController {
  /**
   * Obtener estado de conexión y QR code
   */
  static async getStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const status = WhatsAppWebService.getStatus();
      
      res.json({
        success: true,
        data: status
      });
    } catch (error: any) {
      logger.error('Error getting WhatsApp status:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener estado de WhatsApp'
      });
    }
  }

  /**
   * Inicializar/Reconectar WhatsApp
   */
  static async connect(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      logger.info('📱 Iniciando conexión de WhatsApp...');
      
      // Inicializar en segundo plano
      WhatsAppWebService.initialize().catch(error => {
        logger.error('Error en inicialización de WhatsApp:', error);
      });

      res.json({
        success: true,
        message: 'Conexión iniciada. Escanea el código QR cuando aparezca.'
      });
    } catch (error: any) {
      logger.error('Error connecting WhatsApp:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al conectar WhatsApp'
      });
    }
  }

  /**
   * Desconectar WhatsApp
   */
  static async disconnect(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await WhatsAppWebService.disconnect();
      
      res.json({
        success: true,
        message: 'WhatsApp desconectado correctamente'
      });
    } catch (error: any) {
      logger.error('Error disconnecting WhatsApp:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al desconectar WhatsApp'
      });
    }
  }

  /**
   * Enviar mensaje de prueba
   */
  static async sendTestMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { phoneNumber, message } = req.body;

      if (!phoneNumber || !message) {
        res.status(400).json({
          success: false,
          error: 'Número de teléfono y mensaje son requeridos'
        });
        return;
      }

      const result = await WhatsAppWebService.sendMessage(phoneNumber, message);

      res.json({
        success: result.success,
        data: result,
        message: result.success 
          ? 'Mensaje enviado correctamente' 
          : result.error
      });
    } catch (error: any) {
      logger.error('Error sending test message:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al enviar mensaje'
      });
    }
  }
}

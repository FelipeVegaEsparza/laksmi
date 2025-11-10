import { ClientModel } from '../models/Client';
import { ConversationModel } from '../models/Conversation';
import { MessageRouter } from './ai/MessageRouter';
import { WhatsAppConversationLogger } from './WhatsAppConversationLogger';
import { TwilioWebhookPayload } from './TwilioService';
import { ProcessMessageRequest, ConversationChannel } from '../types/ai';
import logger from '../utils/logger';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

export interface WhatsAppMediaInfo {
  url: string;
  contentType: string;
  filename: string;
  size?: number;
  localPath?: string;
}

export interface ProcessedWhatsAppMessage {
  phoneNumber: string;
  clientId: string;
  message: string;
  mediaInfo?: WhatsAppMediaInfo;
  profileName?: string;
  messageSid: string;
  timestamp: Date;
  isNewClient: boolean;
}

export class WhatsAppMessageProcessor {
  private static readonly SUPPORTED_MEDIA_TYPES = [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'audio/ogg',
    'audio/mpeg',
    'video/mp4'
  ];

  private static readonly MAX_MEDIA_SIZE = 16 * 1024 * 1024; // 16MB
  private static readonly MEDIA_STORAGE_PATH = 'uploads/whatsapp';

  /**
   * Procesar mensaje entrante de WhatsApp
   */
  static async processIncomingMessage(payload: TwilioWebhookPayload): Promise<{
    success: boolean;
    response?: string;
    error?: string;
    clientId?: string;
    conversationId?: string;
  }> {
    try {
      // Extraer información básica del payload
      const messageInfo = this.extractMessageInfo(payload);
      
      // Ignorar mensajes de estado o vacíos
      if (this.shouldIgnoreMessage(payload)) {
        logger.info('Message ignored (status update or empty)', {
          messageSid: payload.MessageSid,
          status: payload.SmsStatus,
          body: payload.Body
        });
        return { success: true };
      }

      // Procesar mensaje y obtener/crear cliente
      const processedMessage = await this.processMessage(payload);
      
      // Descargar y procesar multimedia si existe
      if (payload.MediaUrl0) {
        processedMessage.mediaInfo = await this.processMedia(
          payload.MediaUrl0,
          payload.MediaContentType0 || 'application/octet-stream',
          processedMessage.messageSid
        );
      }

      // Registrar mensaje procesado
      await this.logProcessedMessage(processedMessage);

      // Crear request para el router de IA
      const aiRequest: ProcessMessageRequest = {
        content: processedMessage.message,
        clientId: processedMessage.clientId,
        channel: 'whatsapp' as ConversationChannel,
        mediaUrl: processedMessage.mediaInfo?.localPath,
        metadata: {
          phone: processedMessage.phoneNumber,
          profileName: processedMessage.profileName,
          messageSid: processedMessage.messageSid,
          mediaInfo: processedMessage.mediaInfo,
          isNewClient: processedMessage.isNewClient
        }
      };

      // Procesar con el router de IA
      const aiResponse = await MessageRouter.processMessage(aiRequest);

      // Registrar mensaje entrante en el logger
      await WhatsAppConversationLogger.logIncomingMessage(
        processedMessage,
        aiResponse.conversationId,
        {
          intent: aiResponse.response.intent || 'unknown',
          confidence: 0.8, // Simplificado por ahora
          processingTime: aiResponse.processingTime
        }
      );

      // Registrar respuesta saliente si existe
      if (aiResponse.response.message) {
        await WhatsAppConversationLogger.logOutgoingMessage(
          aiResponse.conversationId,
          processedMessage.clientId,
          processedMessage.phoneNumber,
          aiResponse.response.message
        );
      }

      // Registrar escalación si es necesaria
      if (aiResponse.response.needsHumanEscalation) {
        await WhatsAppConversationLogger.logEscalation(
          aiResponse.conversationId,
          processedMessage.clientId,
          processedMessage.phoneNumber,
          'AI escalation required'
        );
      }

      logger.info('WhatsApp message processed successfully', {
        clientId: processedMessage.clientId,
        conversationId: aiResponse.conversationId,
        responseLength: aiResponse.response.message?.length || 0,
        processingTime: aiResponse.processingTime,
        escalated: aiResponse.response.needsHumanEscalation
      });

      return {
        success: true,
        response: aiResponse.response.message,
        clientId: processedMessage.clientId,
        conversationId: aiResponse.conversationId
      };

    } catch (error: any) {
      logger.error('Error processing WhatsApp message:', {
        error: error.message,
        stack: error.stack,
        messageSid: payload.MessageSid,
        from: payload.From
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Identificar o crear cliente por número de teléfono
   */
  static async identifyOrCreateClient(phoneNumber: string, profileName?: string): Promise<{
    client: any;
    isNewClient: boolean;
  }> {
    try {
      // Normalizar número de teléfono
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
      
      // Buscar cliente existente
      let client = await ClientModel.findByPhone(normalizedPhone);
      
      if (client) {
        logger.info('Existing client identified', {
          clientId: client.id,
          phone: normalizedPhone,
          name: client.name
        });
        
        return { client, isNewClient: false };
      }

      // Crear nuevo cliente
      const clientName = profileName || `Cliente WhatsApp ${normalizedPhone.slice(-4)}`;
      
      client = await ClientModel.create({
        phone: normalizedPhone,
        name: clientName,
        allergies: [],
        preferences: []
      });

      logger.info('New client created from WhatsApp', {
        clientId: client.id,
        phone: normalizedPhone,
        name: clientName,
        profileName
      });

      return { client, isNewClient: true };

    } catch (error: any) {
      logger.error('Error identifying/creating client:', error);
      throw new Error(`Failed to identify client: ${error.message}`);
    }
  }

  /**
   * Recuperar contexto de conversación existente
   */
  static async retrieveConversationContext(clientId: string): Promise<{
    conversationId?: string;
    hasActiveConversation: boolean;
    lastActivity?: Date;
    messageCount: number;
  }> {
    try {
      // Buscar conversación activa de WhatsApp
      const conversation = await ConversationModel.findByClientAndChannel(clientId, 'whatsapp');
      
      if (!conversation) {
        return {
          hasActiveConversation: false,
          messageCount: 0
        };
      }

      // Obtener conteo de mensajes
      const messages = await ConversationModel.getMessages(conversation.id, 1);
      const messageCount = messages.length;

      logger.info('Conversation context retrieved', {
        conversationId: conversation.id,
        clientId,
        lastActivity: conversation.lastActivity,
        messageCount
      });

      return {
        conversationId: conversation.id,
        hasActiveConversation: conversation.status === 'active',
        lastActivity: conversation.lastActivity,
        messageCount
      };

    } catch (error: any) {
      logger.error('Error retrieving conversation context:', error);
      return {
        hasActiveConversation: false,
        messageCount: 0
      };
    }
  }

  /**
   * Procesar multimedia de WhatsApp
   */
  static async processMedia(
    mediaUrl: string,
    contentType: string,
    messageSid: string
  ): Promise<WhatsAppMediaInfo | undefined> {
    try {
      // Verificar tipo de archivo soportado
      if (!this.SUPPORTED_MEDIA_TYPES.includes(contentType)) {
        logger.warn('Unsupported media type received', {
          contentType,
          messageSid
        });
        return undefined;
      }

      // Generar nombre de archivo único
      const fileExtension = this.getFileExtension(contentType);
      const filename = `${messageSid}_${Date.now()}${fileExtension}`;
      const localPath = path.join(this.MEDIA_STORAGE_PATH, filename);

      // Crear directorio si no existe
      await this.ensureDirectoryExists(this.MEDIA_STORAGE_PATH);

      // Descargar archivo
      const response = await fetch(mediaUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to download media: ${response.statusText}`);
      }

      const contentLength = response.headers.get('content-length');
      const fileSize = contentLength ? parseInt(contentLength) : 0;

      // Verificar tamaño de archivo
      if (fileSize > this.MAX_MEDIA_SIZE) {
        logger.warn('Media file too large', {
          size: fileSize,
          maxSize: this.MAX_MEDIA_SIZE,
          messageSid
        });
        return undefined;
      }

      // Guardar archivo
      const buffer = await response.arrayBuffer();
      await fs.writeFile(localPath, Buffer.from(buffer));

      const mediaInfo: WhatsAppMediaInfo = {
        url: mediaUrl,
        contentType,
        filename,
        size: fileSize,
        localPath
      };

      logger.info('Media file processed successfully', {
        filename,
        contentType,
        size: fileSize,
        messageSid
      });

      return mediaInfo;

    } catch (error: any) {
      logger.error('Error processing media:', {
        error: error.message,
        mediaUrl,
        contentType,
        messageSid
      });
      return undefined;
    }
  }

  /**
   * Registrar mensaje procesado para auditoría
   */
  static async logProcessedMessage(message: ProcessedWhatsAppMessage): Promise<void> {
    try {
      // Log estructurado para análisis
      logger.info('WhatsApp message logged', {
        phoneNumber: message.phoneNumber,
        clientId: message.clientId,
        messageLength: message.message.length,
        hasMedia: !!message.mediaInfo,
        mediaType: message.mediaInfo?.contentType,
        profileName: message.profileName,
        messageSid: message.messageSid,
        timestamp: message.timestamp,
        isNewClient: message.isNewClient
      });

      // Aquí se podría implementar logging adicional a base de datos
      // para análisis de patrones, métricas de uso, etc.

    } catch (error: any) {
      logger.error('Error logging processed message:', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }

  // Métodos privados de utilidad

  private static extractMessageInfo(payload: TwilioWebhookPayload): {
    phoneNumber: string;
    message: string;
    profileName?: string;
    messageSid: string;
  } {
    return {
      phoneNumber: this.normalizePhoneNumber(payload.From.replace('whatsapp:', '')),
      message: payload.Body || '',
      profileName: payload.ProfileName,
      messageSid: payload.MessageSid
    };
  }

  private static shouldIgnoreMessage(payload: TwilioWebhookPayload): boolean {
    // Ignorar actualizaciones de estado sin contenido
    if (payload.SmsStatus && !payload.Body) {
      return true;
    }

    // Ignorar mensajes completamente vacíos
    if (!payload.Body?.trim() && !payload.MediaUrl0) {
      return true;
    }

    return false;
  }

  private static async processMessage(payload: TwilioWebhookPayload): Promise<ProcessedWhatsAppMessage> {
    const messageInfo = this.extractMessageInfo(payload);
    
    // Identificar o crear cliente
    const { client, isNewClient } = await this.identifyOrCreateClient(
      messageInfo.phoneNumber,
      messageInfo.profileName
    );

    return {
      phoneNumber: messageInfo.phoneNumber,
      clientId: client.id,
      message: messageInfo.message,
      profileName: messageInfo.profileName,
      messageSid: messageInfo.messageSid,
      timestamp: new Date(),
      isNewClient
    };
  }

  private static normalizePhoneNumber(phoneNumber: string): string {
    // Remover prefijo whatsapp: si existe
    let normalized = phoneNumber.replace('whatsapp:', '');
    
    // Remover espacios y caracteres especiales
    normalized = normalized.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    
    // Asegurar que tenga código de país
    if (!normalized.startsWith('+')) {
      if (normalized.startsWith('1') && normalized.length === 11) {
        normalized = '+' + normalized;
      } else if (normalized.length === 10) {
        normalized = '+1' + normalized; // Asumir US por defecto
      } else {
        normalized = '+' + normalized;
      }
    }
    
    return normalized;
  }

  private static getFileExtension(contentType: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'application/pdf': '.pdf',
      'text/plain': '.txt',
      'audio/ogg': '.ogg',
      'audio/mpeg': '.mp3',
      'video/mp4': '.mp4'
    };

    return extensions[contentType] || '.bin';
  }

  private static async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Obtener estadísticas de procesamiento
   */
  static getProcessingStats(): {
    supportedMediaTypes: string[];
    maxMediaSize: number;
    mediaStoragePath: string;
  } {
    return {
      supportedMediaTypes: [...this.SUPPORTED_MEDIA_TYPES],
      maxMediaSize: this.MAX_MEDIA_SIZE,
      mediaStoragePath: this.MEDIA_STORAGE_PATH
    };
  }

  /**
   * Limpiar archivos multimedia antiguos
   */
  static async cleanupOldMedia(daysOld: number = 30): Promise<{
    filesDeleted: number;
    spaceFreed: number;
  }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      let filesDeleted = 0;
      let spaceFreed = 0;

      // Leer directorio de medios
      const files = await fs.readdir(this.MEDIA_STORAGE_PATH);

      for (const file of files) {
        const filePath = path.join(this.MEDIA_STORAGE_PATH, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime < cutoffDate) {
          spaceFreed += stats.size;
          await fs.unlink(filePath);
          filesDeleted++;
        }
      }

      logger.info('Media cleanup completed', {
        filesDeleted,
        spaceFreed,
        daysOld
      });

      return { filesDeleted, spaceFreed };

    } catch (error: any) {
      logger.error('Error during media cleanup:', error);
      return { filesDeleted: 0, spaceFreed: 0 };
    }
  }

  /**
   * Validar integridad de archivo multimedia
   */
  static async validateMediaFile(filePath: string): Promise<{
    isValid: boolean;
    contentType?: string;
    size?: number;
    hash?: string;
  }> {
    try {
      const stats = await fs.stat(filePath);
      const buffer = await fs.readFile(filePath);
      
      // Generar hash para integridad
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');
      
      // Detectar tipo de contenido por magic bytes
      const contentType = this.detectContentType(buffer);

      return {
        isValid: true,
        contentType,
        size: stats.size,
        hash
      };

    } catch (error: any) {
      logger.error('Error validating media file:', error);
      return { isValid: false };
    }
  }

  private static detectContentType(buffer: Buffer): string {
    // Magic bytes para detección de tipo de archivo
    const magicBytes = buffer.subarray(0, 8);
    
    // JPEG
    if (magicBytes[0] === 0xFF && magicBytes[1] === 0xD8) {
      return 'image/jpeg';
    }
    
    // PNG
    if (magicBytes[0] === 0x89 && magicBytes[1] === 0x50 && 
        magicBytes[2] === 0x4E && magicBytes[3] === 0x47) {
      return 'image/png';
    }
    
    // PDF
    if (buffer.toString('ascii', 0, 4) === '%PDF') {
      return 'application/pdf';
    }
    
    // GIF
    if (buffer.toString('ascii', 0, 3) === 'GIF') {
      return 'image/gif';
    }

    return 'application/octet-stream';
  }
}
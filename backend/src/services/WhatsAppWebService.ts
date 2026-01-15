import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import logger from '../utils/logger';

console.log('🚨🚨🚨 WhatsAppWebService MODULE LOADED 🚨🚨🚨');

export class WhatsAppWebService {
  private static client: Client | null = null;
  private static isReady: boolean = false;
  private static qrCode: string = '';
  private static connectionStatus: 'disconnected' | 'qr' | 'connected' | 'error' = 'disconnected';
  private static statusMessage: string = '';

  /**
   * Inicializar cliente de WhatsApp Web
   */
  static async initialize(): Promise<void> {
    try {
      logger.info('🚀 ========== INICIALIZANDO WHATSAPP WEB ==========');
      logger.info('Environment:', process.env.NODE_ENV);
      logger.info('Puppeteer path:', process.env.PUPPETEER_EXECUTABLE_PATH);

      logger.info('Creating WhatsApp Client...');
      this.client = new Client({
        authStrategy: new LocalAuth({
          dataPath: './whatsapp-session'
        }),
        puppeteer: {
          headless: true,
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
            '--disable-software-rasterizer',
            '--disable-extensions',
            '--disable-background-networking',
            '--disable-default-apps',
            '--disable-sync',
            '--disable-translate',
            '--hide-scrollbars',
            '--metrics-recording-only',
            '--mute-audio',
            '--no-default-browser-check',
            '--safebrowsing-disable-auto-update',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
          ]
        }
      });

      // Evento: QR Code generado
      this.client.on('qr', (qr) => {
        logger.info('📱 ========== CÓDIGO QR GENERADO ==========');
        logger.info('Por favor escanea el código QR con tu WhatsApp');
        this.qrCode = qr;
        this.connectionStatus = 'qr';
        this.statusMessage = 'Escanea el código QR con tu WhatsApp';

        // Mostrar QR en consola para debugging
        qrcode.generate(qr, { small: true });
        logger.info('==========================================');
      });

      // Evento: Cliente autenticado (se dispara DESPUÉS de escanear el QR)
      this.client.on('authenticated', () => {
        logger.info('🔐 ========== WHATSAPP AUTENTICADO ==========');
        logger.info('QR escaneado exitosamente, esperando conexión...');
        this.connectionStatus = 'connected';
        this.statusMessage = 'Autenticación exitosa';
        logger.info('==========================================');
      });

      // Evento: Cliente listo (se dispara cuando está completamente conectado)
      this.client.on('ready', async () => {
        logger.info('✅ ========== WHATSAPP WEB READY ==========');
        logger.info('Client is now ready to send and receive messages');
        logger.info('Message listener is active and waiting for messages');
        
        // 🔧 PARCHE: Deshabilitar sendSeen para evitar errores con WhatsApp Web actualizado
        try {
          logger.info('🔧 Aplicando parche para deshabilitar sendSeen...');
          const pupPage = await (this.client as any).pupPage;
          if (pupPage) {
            await pupPage.evaluate(() => {
              // Sobrescribir la función sendSeen para que no haga nada
              // @ts-ignore - WWebJS es inyectado por whatsapp-web.js
              if (window.WWebJS && window.WWebJS.sendSeen) {
                // @ts-ignore
                window.WWebJS.sendSeen = async () => {
                  console.log('sendSeen deshabilitado - parche aplicado');
                  return true;
                };
              }
            });
            logger.info('✅ Parche sendSeen aplicado exitosamente');
          }
        } catch (patchError) {
          logger.warn('⚠️ No se pudo aplicar parche sendSeen (no crítico):', patchError);
        }
        
        logger.info('==========================================');
        this.isReady = true;
        this.connectionStatus = 'connected';
        this.statusMessage = 'WhatsApp conectado correctamente';
        this.qrCode = '';
      });

      // Evento: Loading screen (progreso de conexión)
      this.client.on('loading_screen', (percent, message) => {
        logger.info(`⏳ Cargando WhatsApp Web: ${percent}% - ${message}`);
      });

      // Evento: Desconexión
      this.client.on('disconnected', (reason) => {
        logger.warn('⚠️  WhatsApp desconectado:', reason);
        this.isReady = false;
        this.connectionStatus = 'disconnected';
        this.statusMessage = `Desconectado: ${reason}`;
        this.qrCode = '';
      });

      // Evento: Error de autenticación
      this.client.on('auth_failure', (msg) => {
        logger.error('❌ Error de autenticación:', msg);
        this.connectionStatus = 'error';
        this.statusMessage = 'Error de autenticación. Intenta reconectar.';
      });

      // Evento: Mensaje recibido
      this.client.on('message', async (message: Message) => {
        logger.info('🔔 EVENT: message listener triggered!');
        await this.handleIncomingMessage(message);
      });

      logger.info('✅ Message listener registered');

      // Inicializar cliente
      logger.info('Calling client.initialize()...');
      await this.client.initialize();
      logger.info('✅ Cliente de WhatsApp Web inicializado exitosamente');

    } catch (error) {
      logger.error('❌ Error inicializando WhatsApp Web:', error);
      this.connectionStatus = 'error';
      this.statusMessage = 'Error al inicializar WhatsApp';
      throw error;
    }
  }

  /**
   * Obtener estado de conexión
   */
  static getStatus(): {
    status: string;
    message: string;
    qrCode: string;
    isReady: boolean;
  } {
    return {
      status: this.connectionStatus,
      message: this.statusMessage,
      qrCode: this.qrCode,
      isReady: this.isReady
    };
  }

  /**
   * Enviar mensaje de WhatsApp
   */
  static async sendMessage(to: string, message: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    if (!this.client || !this.isReady) {
      return {
        success: false,
        error: 'WhatsApp no está conectado. Escanea el código QR primero.'
      };
    }

    try {
      // Formatear número (agregar @c.us si no lo tiene)
      const chatId = to.includes('@c.us') ? to : `${to.replace(/[^\d]/g, '')}@c.us`;

      const sentMessage = await this.client.sendMessage(chatId, message);

      logger.info('✅ Mensaje enviado:', {
        to: chatId,
        messageId: sentMessage.id.id
      });

      return {
        success: true,
        messageId: sentMessage.id.id
      };
    } catch (error: any) {
      logger.error('❌ Error enviando mensaje:', error);
      return {
        success: false,
        error: error.message || 'Error al enviar mensaje'
      };
    }
  }

  /**
   * Manejar mensaje entrante
   */
  private static async handleIncomingMessage(message: Message): Promise<void> {
    try {
      // Ignorar mensajes propios
      if (message.fromMe) {
        logger.info('⏭️  Ignorando mensaje propio');
        return;
      }

      logger.info('📨 ========== MENSAJE RECIBIDO ==========');
      logger.info('From:', message.from);
      logger.info('Body:', message.body);
      logger.info('Type:', message.type);
      logger.info('ID:', message.id.id);

      // Obtener información del contacto (con fallback por errores de versión de WA)
      let contact: any;
      try {
        contact = await message.getContact();
        logger.info('Contact:', {
          name: contact.pushname,
          number: contact.number
        });
      } catch (contactError) {
        logger.warn('⚠️ No se pudo obtener info del contacto (usando fallback):', contactError);
        contact = {
          pushname: (message as any)._data?.notifyName || 'Usuario WhatsApp',
          number: message.from.replace(/[^\d]/g, '')
        };
      }

      // Convertir el mensaje al formato que espera el procesador
      const phoneNumber = message.from.replace('@c.us', '').replace('@s.whatsapp.net', '');
      const payload = {
        From: `whatsapp:+${phoneNumber}`,
        Body: message.body || '',
        MessageSid: message.id.id,
        To: 'whatsapp:+56912345678', // Número de la clínica (no se usa realmente)
        ProfileName: contact.pushname || 'Usuario',
        NumMedia: '0'
      };

      logger.info('📤 Enviando a WhatsAppMessageProcessor...');
      logger.info('Payload:', JSON.stringify(payload, null, 2));

      const { WhatsAppMessageProcessor } = await import('./WhatsAppMessageProcessor');
      logger.info('📞 Calling WhatsAppMessageProcessor.processIncomingMessage...');
      const result = await WhatsAppMessageProcessor.processIncomingMessage(payload as any);

      logger.info('📥 Resultado del procesador:', {
        success: result.success,
        hasResponse: !!result.response,
        responseLength: result.response?.length,
        error: result.error,
        clientId: result.clientId,
        conversationId: result.conversationId
      });

      if (result.success && result.response) {
        // Enviar respuesta
        logger.info('💬 Enviando respuesta:', result.response.substring(0, 100) + '...');
        
        try {
          // Intentar enviar con reply primero
          await message.reply(result.response);
          logger.info('✅ Respuesta enviada automáticamente con reply');
        } catch (replyError: any) {
          // Si falla reply (por problemas con sendSeen), usar sendMessage directo
          logger.warn('⚠️ Reply falló, intentando con sendMessage directo:', replyError.message);
          
          try {
            const chat = await message.getChat();
            await chat.sendMessage(result.response);
            logger.info('✅ Respuesta enviada con sendMessage directo');
          } catch (sendError: any) {
            logger.error('❌ Ambos métodos fallaron:', sendError.message);
            // Último intento: usar el cliente directamente sin opciones extras
            try {
              await this.client!.sendMessage(message.from, result.response);
              logger.info('✅ Respuesta enviada con cliente directo');
            } catch (finalError: any) {
              logger.error('❌ Error final enviando mensaje:', finalError.message);
              throw finalError;
            }
          }
        }
      } else if (result.error) {
        logger.error('❌ Error en el procesador:', result.error);
        
        // Enviar mensaje de error al usuario con manejo robusto
        try {
          await message.reply('Lo siento, ha ocurrido un error. Un especialista te contactará pronto.');
        } catch (replyError: any) {
          logger.warn('⚠️ No se pudo enviar mensaje de error con reply, intentando alternativa');
          try {
            await this.client!.sendMessage(message.from, 'Lo siento, ha ocurrido un error. Un especialista te contactará pronto.');
          } catch (sendError: any) {
            logger.error('❌ No se pudo enviar mensaje de error:', sendError.message);
          }
        }
      } else {
        logger.warn('⚠️  No se generó respuesta');
      }

      logger.info('========================================');

    } catch (error: any) {
      logger.error('❌ ========== ERROR EN WHATSAPPWEBSERVICE ==========');
      logger.error('Error procesando mensaje en WhatsAppWebService:', {
        errorMessage: error.message,
        errorStack: error.stack,
        errorType: error.constructor.name,
        errorCode: error.code,
        from: message?.from,
        body: message?.body,
        messageId: message?.id?.id
      });
      logger.error('====================================================');

      // LOG CRÍTICO PARA DEBUGGING EN PRODUCCIÓN
      console.error('🚨 CRITICAL WHATSAPP ERROR:', {
        message: error.message,
        stack: error.stack,
        from: message?.from
      });

      // Intentar enviar mensaje de error al usuario con manejo robusto
      try {
        await message.reply('Lo siento, ha ocurrido un error técnico. Por favor, intenta de nuevo en unos momentos.');
      } catch (replyError: any) {
        // Si falla reply, intentar con cliente directo
        try {
          await this.client!.sendMessage(message.from, 'Lo siento, ha ocurrido un error técnico. Por favor, intenta de nuevo en unos momentos.');
          logger.info('✅ Mensaje de error enviado con cliente directo');
        } catch (sendError: any) {
          logger.error('❌ No se pudo enviar mensaje de error al usuario:', sendError.message);
        }
      }
    }
  }

  /**
   * Desconectar WhatsApp
   */
  static async disconnect(): Promise<void> {
    try {
      logger.info('🔌 Desconectando WhatsApp...');

      if (this.client) {
        logger.info('Destroying client...');
        await this.client.destroy();
        logger.info('Client destroyed');
      }

      this.client = null;
      this.isReady = false;
      this.connectionStatus = 'disconnected';
      this.statusMessage = 'Desconectado manualmente';
      this.qrCode = '';

      // Eliminar la sesión guardada para permitir conectar con otro número
      try {
        const fs = require('fs');
        const path = require('path');
        const sessionPath = path.join(process.cwd(), 'whatsapp-session');

        if (fs.existsSync(sessionPath)) {
          logger.info('🗑️  Eliminando sesión guardada...');
          fs.rmSync(sessionPath, { recursive: true, force: true });
          logger.info('✅ Sesión eliminada correctamente');
        }
      } catch (sessionError: any) {
        logger.warn('⚠️  No se pudo eliminar la sesión:', sessionError.message);
        // No fallar si no se puede eliminar la sesión
      }

      logger.info('✅ WhatsApp desconectado exitosamente');
    } catch (error: any) {
      logger.error('❌ Error al desconectar WhatsApp:', {
        message: error.message,
        stack: error.stack
      });

      // Forzar desconexión aunque haya error
      this.client = null;
      this.isReady = false;
      this.connectionStatus = 'disconnected';
      this.statusMessage = 'Desconectado (con errores)';
      this.qrCode = '';

      // Intentar eliminar sesión de todas formas
      try {
        const fs = require('fs');
        const path = require('path');
        const sessionPath = path.join(process.cwd(), 'whatsapp-session');
        if (fs.existsSync(sessionPath)) {
          fs.rmSync(sessionPath, { recursive: true, force: true });
        }
      } catch (sessionError) {
        // Ignorar errores al eliminar sesión
      }

      // No lanzar el error, solo loguearlo
      logger.warn('⚠️  Desconexión forzada debido a error');
    }
  }

  /**
   * Reconectar WhatsApp
   */
  static async reconnect(): Promise<void> {
    await this.disconnect();
    await this.initialize();
  }

  /**
   * Verificar si está conectado
   */
  static isConnected(): boolean {
    return this.isReady && this.connectionStatus === 'connected';
  }
}

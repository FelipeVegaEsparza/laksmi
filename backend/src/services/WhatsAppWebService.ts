import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import logger from '../utils/logger';
import db from '../config/database';

console.log('🚨🚨🚨 WhatsAppWebService MODULE LOADED 🚨🚨🚨');

export class WhatsAppWebService {
  private static client: Client | null = null;
  private static isReady: boolean = false;
  private static qrCode: string = '';
  private static connectionStatus: 'disconnected' | 'qr' | 'connected' | 'error' = 'disconnected';
  private static statusMessage: string = '';
  private static readyTimeout: NodeJS.Timeout | null = null;
  private static initializationAttempts: number = 0;
  private static readonly MAX_INIT_ATTEMPTS = 3;
  private static readonly READY_TIMEOUT_MS = 120000; // 2 minutos

  /**
   * Inicializar cliente de WhatsApp Web
   */
  static async initialize(): Promise<void> {
    try {
      this.initializationAttempts++;
      logger.info('🚀 ========== INICIALIZANDO WHATSAPP WEB ==========');
      logger.info('Environment:', process.env.NODE_ENV);
      logger.info('Puppeteer path:', process.env.PUPPETEER_EXECUTABLE_PATH);
      logger.info('Intento de inicialización:', this.initializationAttempts);

      // Si ya hay un cliente, destruirlo primero
      if (this.client) {
        logger.info('Destruyendo cliente existente...');
        try {
          await this.client.destroy();
        } catch (e) {
          logger.warn('Error al destruir cliente existente:', e);
        }
        this.client = null;
      }

      // Limpiar timeout anterior si existe
      if (this.readyTimeout) {
        clearTimeout(this.readyTimeout);
        this.readyTimeout = null;
      }

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

        // Iniciar timeout para detectar si nunca llega el evento "ready"
        this.startReadyTimeout();
      });

      // Evento: Cliente autenticado (se dispara DESPUÉS de escanear el QR)
      this.client.on('authenticated', () => {
        logger.info('🔐 ========== WHATSAPP AUTENTICADO ==========');
        logger.info('QR escaneado exitosamente, esperando conexión...');
        this.connectionStatus = 'connected';
        this.statusMessage = 'Autenticación exitosa, conectando...';
        logger.info('==========================================');

        // Reiniciar timeout después de autenticación
        this.startReadyTimeout();
      });

      // Evento: Cliente listo (se dispara cuando está completamente conectado)
      this.client.on('ready', async () => {
        logger.info('✅ ========== WHATSAPP WEB READY ==========');
        logger.info('Client is now ready to send and receive messages');
        logger.info('Message listener is active and waiting for messages');
        
        // Limpiar timeout ya que llegamos al estado ready
        if (this.readyTimeout) {
          clearTimeout(this.readyTimeout);
          this.readyTimeout = null;
        }

        // Resetear contador de intentos
        this.initializationAttempts = 0;
        
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
        
        // Limpiar timeout
        if (this.readyTimeout) {
          clearTimeout(this.readyTimeout);
          this.readyTimeout = null;
        }
      });

      // Evento: Error de autenticación
      this.client.on('auth_failure', (msg) => {
        logger.error('❌ Error de autenticación:', msg);
        this.connectionStatus = 'error';
        this.statusMessage = 'Error de autenticación. Intenta reconectar.';
        
        // Limpiar timeout
        if (this.readyTimeout) {
          clearTimeout(this.readyTimeout);
          this.readyTimeout = null;
        }
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
      
      // Limpiar timeout
      if (this.readyTimeout) {
        clearTimeout(this.readyTimeout);
        this.readyTimeout = null;
      }

      // Si no hemos alcanzado el máximo de intentos, intentar de nuevo
      if (this.initializationAttempts < this.MAX_INIT_ATTEMPTS) {
        logger.info(`🔄 Reintentando inicialización en 10 segundos... (Intento ${this.initializationAttempts}/${this.MAX_INIT_ATTEMPTS})`);
        setTimeout(() => {
          this.initialize().catch(err => {
            logger.error('Error en reintento de inicialización:', err);
          });
        }, 10000);
      } else {
        logger.error('❌ Máximo de intentos de inicialización alcanzado. Por favor, revisa la configuración.');
        throw error;
      }
    }
  }

  /**
   * Iniciar timeout para detectar si el evento "ready" nunca llega
   */
  private static startReadyTimeout(): void {
    // Limpiar timeout anterior si existe
    if (this.readyTimeout) {
      clearTimeout(this.readyTimeout);
    }

    this.readyTimeout = setTimeout(() => {
      if (!this.isReady) {
        logger.error('⏰ ========== TIMEOUT: READY EVENT NEVER FIRED ==========');
        logger.error('El cliente se autenticó pero nunca llegó al estado "ready"');
        logger.error('Esto puede indicar:');
        logger.error('1. Versión incompatible de whatsapp-web.js');
        logger.error('2. Problemas con Puppeteer/Chromium en Docker');
        logger.error('3. Sesión corrupta que necesita ser eliminada');
        logger.error('========================================================');

        this.connectionStatus = 'error';
        this.statusMessage = 'Timeout: No se pudo conectar completamente. Intenta eliminar la sesión y reconectar.';

        // Intentar reconectar automáticamente
        if (this.initializationAttempts < this.MAX_INIT_ATTEMPTS) {
          logger.info('🔄 Intentando reconexión automática...');
          this.reconnect().catch(err => {
            logger.error('Error en reconexión automática:', err);
          });
        }
      }
    }, this.READY_TIMEOUT_MS);
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

      // 🔍 DETECTAR SI EL MENSAJE VIENE DEL NÚMERO DE LA CLÍNICA
      // ⚠️ TEMPORALMENTE DESHABILITADO PARA DEBUGGING
      // Si es así, activar control humano automáticamente
      /* COMENTADO TEMPORALMENTE PARA DEBUGGING
      const { CompanySettingsModel } = await import('../models/CompanySettings');
      const companySettings = await CompanySettingsModel.getSettings();
      
      if (companySettings?.contactWhatsapp) {
        // Normalizar números para comparación (solo dígitos)
        const clinicNumber = companySettings.contactWhatsapp.replace(/[^\d]/g, '');
        const messageFromNumber = message.from.replace(/[^\d]/g, '');
        
        if (messageFromNumber === clinicNumber) {
          logger.info('🧑 Mensaje detectado del número de la clínica - Activando control humano automáticamente');
          
          // Obtener conversación activa del cliente que está recibiendo el mensaje
          // El mensaje viene DE la clínica, así que necesitamos encontrar la conversación
          // donde la clínica está respondiendo
          const { ConversationModel } = await import('../models/Conversation');
          const { HumanTakeoverService } = await import('./ai/HumanTakeoverService');
          
          // Buscar conversaciones activas recientes en WhatsApp
          const recentConversations = await db('conversations')
            .where('channel', 'whatsapp')
            .whereIn('status', ['active', 'escalated'])
            .orderBy('updated_at', 'desc')
            .limit(10);
          
          // Activar control humano en todas las conversaciones activas de WhatsApp
          // para que el bot no responda mientras el humano está escribiendo
          for (const conv of recentConversations) {
            const session = HumanTakeoverService.getActiveSession(conv.id);
            
            if (session) {
              // Ya hay sesión activa, solo actualizar timestamp
              session.lastHumanMessageTime = new Date();
              logger.info(`⏰ Timestamp actualizado para conversación ${conv.id}`);
            } else {
              // No hay sesión, crear una nueva
              await HumanTakeoverService.startTakeover(
                conv.id,
                'whatsapp-human-agent', // ID genérico para agente humano de WhatsApp
                undefined
              );
              logger.info(`✅ Control humano activado automáticamente para conversación ${conv.id}`);
            }
          }
          
          // No procesar este mensaje más (es del humano, no del cliente)
          logger.info('⏭️  Mensaje de la clínica procesado, no se enviará al bot');
          return;
        }
      }
      FIN DEL COMENTARIO TEMPORAL */
      
      logger.info('🤖 Control humano deshabilitado temporalmente - Bot responderá a todos los mensajes');

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

      // Limpiar timeout si existe
      if (this.readyTimeout) {
        clearTimeout(this.readyTimeout);
        this.readyTimeout = null;
      }

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
      this.initializationAttempts = 0;

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
      if (this.readyTimeout) {
        clearTimeout(this.readyTimeout);
        this.readyTimeout = null;
      }
      
      this.client = null;
      this.isReady = false;
      this.connectionStatus = 'disconnected';
      this.statusMessage = 'Desconectado (con errores)';
      this.qrCode = '';
      this.initializationAttempts = 0;

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

import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import logger from '../utils/logger';

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
            '--disable-gpu',
            '--disable-software-rasterizer',
            '--disable-dev-shm-usage'
          ]
        }
      });

      // Evento: QR Code generado
      this.client.on('qr', (qr) => {
        logger.info('📱 Código QR generado');
        this.qrCode = qr;
        this.connectionStatus = 'qr';
        this.statusMessage = 'Escanea el código QR con tu WhatsApp';
        
        // Mostrar QR en consola para debugging
        qrcode.generate(qr, { small: true });
      });

      // Evento: Cliente listo
      this.client.on('ready', () => {
        logger.info('✅ WhatsApp Web conectado y listo');
        this.isReady = true;
        this.connectionStatus = 'connected';
        this.statusMessage = 'WhatsApp conectado correctamente';
        this.qrCode = '';
      });

      // Evento: Cliente autenticado
      this.client.on('authenticated', () => {
        logger.info('🔐 WhatsApp autenticado');
        this.connectionStatus = 'connected';
        this.statusMessage = 'Autenticación exitosa';
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
        await this.handleIncomingMessage(message);
      });

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
        return;
      }

      logger.info('📨 Mensaje recibido:', {
        from: message.from,
        body: message.body,
        type: message.type
      });

      // Aquí se integrará con el procesador de mensajes existente
      // Por ahora solo logueamos
      const { WhatsAppMessageProcessor } = await import('./WhatsAppMessageProcessor');
      
      // Convertir el mensaje al formato que espera el procesador
      const payload = {
        From: `whatsapp:${message.from.replace('@c.us', '')}`,
        Body: message.body,
        MessageSid: message.id.id,
        To: 'whatsapp:+tu_numero', // Se puede obtener del cliente
        ProfileName: (await message.getContact()).pushname || 'Usuario'
      };

      const result = await WhatsAppMessageProcessor.processIncomingMessage(payload as any);

      if (result.success && result.response) {
        // Enviar respuesta
        await message.reply(result.response);
        logger.info('✅ Respuesta enviada automáticamente');
      }

    } catch (error) {
      logger.error('❌ Error procesando mensaje:', error);
    }
  }

  /**
   * Desconectar WhatsApp
   */
  static async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.destroy();
      this.client = null;
      this.isReady = false;
      this.connectionStatus = 'disconnected';
      this.statusMessage = 'Desconectado manualmente';
      this.qrCode = '';
      logger.info('🔌 WhatsApp desconectado');
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

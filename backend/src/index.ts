// SOLUCIÓN DEFINITIVA: index.ts solo inicializa el servidor, app.ts maneja toda la configuración
import { createServer } from 'http';
import config from './config';
import logger from './utils/logger';
import db from './config/database';
import { SchedulerService } from './services/SchedulerService';
import { ContextManager } from './services/ai/ContextManager';
import { AlertService } from './services/AlertService';
import { TwilioService } from './services/TwilioService';
import { RealTimeNotificationService } from './services/RealTimeNotificationService';
import { SecurityAuditService } from './services/SecurityAuditService';
import { ConsentService } from './services/ConsentService';
import app from './app'; // Importar la aplicación configurada

console.log('🚨🚨🚨 INDEX MODULE LOADED 🚨🚨🚨');

const server = createServer(app);

// Función para inicializar el servidor
async function startServer() {
  try {
    logger.info('=== INICIANDO SERVIDOR LAKSMI ===');
    logger.info(`Node version: ${process.version}`);
    logger.info(`Platform: ${process.platform}`);
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`Port configured: ${config.port}`);

    // Redis deshabilitado temporalmente
    logger.info('Redis disabled - running without cache');

    // Verificar conexión a la base de datos
    logger.info('Attempting database connection...');
    try {
      await db.raw('SELECT 1');
      logger.info('✅ Database connected successfully');
    } catch (dbError) {
      logger.error('❌ Database connection failed:', dbError);
      throw dbError;
    }

    // Ejecutar migraciones automáticamente
    logger.info('🔄 Ejecutando migraciones automáticas...');
    try {
      const { MigrationService } = await import('./services/MigrationService');
      await MigrationService.runMigrations();
      logger.info('✅ Migraciones completadas');
    } catch (migrationError) {
      logger.error('❌ Error ejecutando migraciones:', migrationError);
      // No detener el servidor si las migraciones fallan, solo advertir
      logger.warn('⚠️  El servidor continuará sin ejecutar las migraciones');
    }

    // Inicializar servicio de notificaciones en tiempo real
    logger.info('Initializing real-time notification service...');
    try {
      RealTimeNotificationService.initialize(server);
      logger.info('✅ Real-time notification service initialized');
    } catch (rtError) {
      logger.error('❌ Real-time notification service failed:', rtError);
      throw rtError;
    }

    // Iniciar servidor
    logger.info(`Attempting to start server on port ${config.port}...`);

    // Agregar timeout para detectar si el servidor no inicia
    const startTimeout = setTimeout(() => {
      logger.error('❌ Server failed to start within 30 seconds');
      process.exit(1);
    }, 30000);

    // Inicializar servicio de Twilio con configuración de BD ANTES de iniciar el servidor
    logger.info('Initializing Twilio service...');
    try {
      logger.info('Importing CompanySettingsModel...');
      const { CompanySettingsModel } = await import('./models/CompanySettings');

      logger.info('Fetching Twilio settings from database...');
      const settings = await CompanySettingsModel.getSettings();

      logger.info('Settings fetched:', {
        hasSettings: !!settings,
        hasAccountSid: !!settings?.twilioAccountSid,
        hasAuthToken: !!settings?.twilioAuthToken
      });

      if (settings && settings.twilioAccountSid && settings.twilioAuthToken) {
        TwilioService.updateConfig({
          accountSid: settings.twilioAccountSid,
          authToken: settings.twilioAuthToken,
          phoneNumber: settings.twilioPhoneNumber || '',
          webhookUrl: settings.twilioWebhookUrl || '',
          validateSignatures: settings.twilioValidateSignatures !== false,
        });
        logger.info('✅ Twilio service initialized with database configuration');
      } else {
        logger.warn('⚠️  Twilio credentials not found in database, using default config');
        TwilioService.initialize();
      }
    } catch (twilioError: any) {
      logger.error('❌ Error initializing Twilio service:', {
        message: twilioError?.message,
        stack: twilioError?.stack
      });
      logger.warn('⚠️  Continuing without Twilio');
      // Inicializar con config por defecto para que no falle
      TwilioService.initialize();
    }

    logger.info('Twilio initialization completed, starting HTTP server...');

    server.listen(config.port, '0.0.0.0', async () => {
      clearTimeout(startTimeout);
      logger.info('=== ✅ SERVIDOR INICIADO EXITOSAMENTE ===');
      logger.info(`🚀 Servidor escuchando en puerto ${config.port}`);
      logger.info(`🌍 Ambiente: ${config.nodeEnv}`);
      logger.info(`📦 API Version: ${config.apiVersion}`);
      logger.info(`❤️  Health check: http://localhost:${config.port}/health`);
      logger.info(`📊 API Base: http://localhost:${config.port}/api/${config.apiVersion}`);

      // Iniciar servicio de programación de notificaciones
      SchedulerService.start();
      logger.info('Notification scheduler service started');

      // Iniciar limpieza automática de contextos de IA
      ContextManager.startCleanupInterval();
      logger.info('AI context cleanup service started');

      // Inicializar servicio de alertas
      AlertService.initialize();
      logger.info('Alert service initialized');

      // Inicializar WhatsApp Web automáticamente
      logger.info('Initializing WhatsApp Web service...');
      try {
        const { WhatsAppWebService } = await import('./services/WhatsAppWebService');
        await WhatsAppWebService.initialize();
        logger.info('✅ WhatsApp Web initialization completed');
      } catch (whatsappError) {
        logger.error('❌ Error initializing WhatsApp Web:', whatsappError);
        logger.warn('⚠️  WhatsApp Web can be started manually from dashboard');
      }

      // Inicializar limpieza de eventos de seguridad
      setInterval(() => {
        SecurityAuditService.cleanupOldEvents();
      }, 60 * 60 * 1000); // Cleanup every hour
      logger.info('Security audit cleanup service started');

      // Inicializar limpieza de consentimientos expirados
      setInterval(() => {
        ConsentService.cleanupExpiredConsents();
      }, 24 * 60 * 60 * 1000); // Cleanup daily
      logger.info('GDPR consent cleanup service started');
    });
  } catch (error) {
    logger.error('❌ ERROR CRÍTICO AL INICIAR EL SERVIDOR:');
    logger.error('Error details:', error);
    if (error instanceof Error) {
      logger.error('Error message:', error.message);
      logger.error('Error stack:', error.stack);
    }
    process.exit(1);
  }
}

// Manejo de cierre graceful
process.on('SIGTERM', async () => {
  logger.info('SIGTERM recibido, cerrando servidor...');
  SchedulerService.stop();
  RealTimeNotificationService.close();
  await db.destroy();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT recibido, cerrando servidor...');
  SchedulerService.stop();
  RealTimeNotificationService.close();
  await db.destroy();
  process.exit(0);
});

// Manejar errores del servidor HTTP
server.on('error', (error: any) => {
  logger.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${config.port} is already in use`);
  }
  process.exit(1);
});

// Manejar errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Iniciar servidor
startServer().catch((error) => {
  logger.error('❌ Failed to start server:', error);
  process.exit(1);
});

export default app;
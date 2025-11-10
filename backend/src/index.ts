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

const server = createServer(app);

// Función para inicializar el servidor
async function startServer() {
  try {
    // Redis deshabilitado temporalmente
    logger.info('Redis disabled - running without cache');

    // Verificar conexión a la base de datos
    await db.raw('SELECT 1');
    logger.info('Database connected successfully');

    // Inicializar servicio de notificaciones en tiempo real
    RealTimeNotificationService.initialize(server);
    logger.info('Real-time notification service initialized');

    // Iniciar servidor
    server.listen(config.port, () => {
      logger.info(`Servidor iniciado en puerto ${config.port}`);
      logger.info(`Ambiente: ${config.nodeEnv}`);
      logger.info(`API Version: ${config.apiVersion}`);
      logger.info(`Health check: http://localhost:${config.port}/health`);
      
      // Iniciar servicio de programación de notificaciones
      SchedulerService.start();
      logger.info('Notification scheduler service started');
      
      // Iniciar limpieza automática de contextos de IA
      ContextManager.startCleanupInterval();
      logger.info('AI context cleanup service started');
      
      // Inicializar servicio de alertas
      AlertService.initialize();
      logger.info('Alert service initialized');
      
      // Inicializar servicio de Twilio
      TwilioService.initialize();
      logger.info('Twilio service initialized');
      
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
    logger.error('Error al iniciar el servidor:', error);
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

// Iniciar servidor
startServer();

export default app;
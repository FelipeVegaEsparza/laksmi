// VERSIÓN MÍNIMA PARA DIAGNÓSTICO
import { createServer } from 'http';
import config from './config';
import logger from './utils/logger';
import db from './config/database';
import app from './app-minimal';

const server = createServer(app);

async function startServer() {
  try {
    logger.info('=== INICIANDO SERVIDOR MÍNIMO ===');
    logger.info(`Port: ${config.port}`);
    logger.info(`Environment: ${config.nodeEnv}`);
    
    // Solo verificar DB
    logger.info('Testing database connection...');
    await db.raw('SELECT 1');
    logger.info('✅ Database OK');
    
    // Iniciar servidor SIN servicios adicionales
    logger.info('Starting HTTP server...');
    
    server.listen(config.port, '0.0.0.0', () => {
      logger.info('=== ✅ SERVER STARTED ===');
      logger.info(`Listening on port ${config.port}`);
      logger.info(`Health check: http://localhost:${config.port}/health`);
    });
    
    // Timeout de seguridad
    setTimeout(() => {
      if (!server.listening) {
        logger.error('❌ Server failed to start in 30s');
        process.exit(1);
      }
    }, 30000);
    
  } catch (error) {
    logger.error('❌ STARTUP ERROR:', error);
    process.exit(1);
  }
}

// Manejo de errores
server.on('error', (error: any) => {
  logger.error('❌ Server error:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('❌ Unhandled rejection:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught exception:', error);
  process.exit(1);
});

// Iniciar
startServer();

export default app;

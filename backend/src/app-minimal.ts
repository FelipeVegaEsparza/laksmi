// VERSIÓN MÍNIMA DE APP PARA DIAGNÓSTICO
import express from 'express';
import cors from 'cors';
import config from './config';
import logger from './utils/logger';

const app: express.Application = express();

logger.info('🔧 Configurando aplicación Express (versión mínima)...');

// Solo CORS y JSON parsing
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
logger.info('✅ Configurando health check endpoint...');
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: config.apiVersion,
    environment: config.nodeEnv
  });
});

// Ruta de prueba
app.get('/api/v1/test', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  logger.warn(`❌ Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    success: false,
    error: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

logger.info('✅ Aplicación Express configurada (versión mínima)');

export default app;

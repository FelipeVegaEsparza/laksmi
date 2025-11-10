import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config';
import logger from './utils/logger';
import { 
  securityHeaders, 
  apiRateLimit, 
  sanitizeInput, 
  validateInput, 
  securityAuditLog,
  requestSizeLimit
} from './middleware/security';
import { checkIPBlocking } from './middleware/ipBlocking';

// Importar rutas - SOLO LAS NECESARIAS
import authRoutes from './routes/auth';
import clientRoutes from './routes/clients';
import loyaltyRoutes from './routes/loyalty';
import productRoutes from './routes/products';
import serviceRoutes from './routes/services';
import bookingRoutes from './routes/bookings';
import notificationRoutes from './routes/notifications';
import aiRoutes from './routes/ai';
import conversationRoutes from './routes/conversations';
import escalationRoutes from './routes/escalations';
import humanTakeoverRoutes from './routes/humanTakeover';
import twilioRoutes from './routes/twilio';
import securityRoutes from './routes/security';
import gdprRoutes from './routes/gdpr';
import uploadRoutes from './routes/upload-working'; // SOLO LA QUE FUNCIONA

const app: express.Application = express();

// CONFIGURACIÓN CORS LIMPIA - UNA SOLA VEZ
const corsConfig = {
  origin: config.nodeEnv === 'development' 
    ? ['http://localhost:5173', 'http://localhost:3001', 'http://localhost:3000']
    : config.frontend.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

// MIDDLEWARE EN ORDEN CORRECTO
// 1. Seguridad básica
app.use(helmet());

// 2. CORS (una sola configuración)
app.use(cors(corsConfig));

// 3. Security middleware
app.use(securityHeaders);
app.use(checkIPBlocking);
app.use(securityAuditLog);
app.use(requestSizeLimit('10mb'));

// 4. Rate limiting (ajustado para desarrollo)
if (config.nodeEnv !== 'development') {
  app.use(apiRateLimit);
} else {
  console.log('⚠️  Rate limiting disabled for development');
}

// 5. Parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 6. Input validation and sanitization
app.use(sanitizeInput);
app.use(validateInput);

// 7. Logging
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// 8. Archivos estáticos con CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static('uploads'));

// 9. Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: config.apiVersion,
    environment: config.nodeEnv
  });
});

// 10. API Routes - LIMPIAS Y ORGANIZADAS
app.use(`/api/${config.apiVersion}/auth`, authRoutes);
app.use(`/api/${config.apiVersion}/clients`, clientRoutes);
app.use(`/api/${config.apiVersion}/loyalty`, loyaltyRoutes);
app.use(`/api/${config.apiVersion}/products`, productRoutes);
app.use(`/api/${config.apiVersion}/services`, serviceRoutes);
app.use(`/api/${config.apiVersion}/bookings`, bookingRoutes);
app.use(`/api/${config.apiVersion}/notifications`, notificationRoutes);
app.use(`/api/${config.apiVersion}/ai`, aiRoutes);
app.use(`/api/${config.apiVersion}/conversations`, conversationRoutes);
app.use(`/api/${config.apiVersion}/escalations`, escalationRoutes);
app.use(`/api/${config.apiVersion}/takeover`, humanTakeoverRoutes);
app.use(`/api/${config.apiVersion}/twilio`, twilioRoutes);
app.use(`/api/${config.apiVersion}/security`, securityRoutes);
app.use(`/api/${config.apiVersion}/gdpr`, gdprRoutes);
app.use(`/api/${config.apiVersion}/upload`, uploadRoutes); // UNA SOLA RUTA DE UPLOAD

// 11. API Info endpoint
app.get(`/api/${config.apiVersion}`, (req, res) => {
  res.json({
    message: 'API del Sistema de Gestión de Clínica de Belleza',
    version: config.apiVersion,
    environment: config.nodeEnv,
    endpoints: {
      auth: '/auth',
      clients: '/clients',
      services: '/services',
      products: '/products',
      bookings: '/bookings',
      notifications: '/notifications',
      conversations: '/conversations',
      escalations: '/escalations',
      takeover: '/takeover',
      twilio: '/twilio',
      loyalty: '/loyalty',
      ai: '/ai',
      security: '/security',
      gdpr: '/gdpr',
      upload: '/upload'
    }
  });
});

// 12. MANEJO DE ERRORES MEJORADO
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Log detallado del error
  logger.error('Error details:', {
    message: err.message,
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    body: req.body,
    user: (req as any).user?.id
  });

  // Respuestas específicas por tipo de error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Datos de entrada inválidos',
      details: config.nodeEnv === 'development' ? err.details : undefined
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'Archivo demasiado grande',
      maxSize: '5MB'
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: 'JSON inválido'
    });
  }

  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      success: false,
      error: 'Servicio no disponible temporalmente'
    });
  }

  // Error genérico
  return res.status(err.status || 500).json({
    success: false,
    error: config.nodeEnv === 'production' 
      ? 'Error interno del servidor' 
      : err.message
  });
});

// 13. Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

export default app;
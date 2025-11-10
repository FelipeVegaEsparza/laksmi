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

// Importar rutas
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
import uploadRoutes from './routes/upload';
import uploadTempRoutes from './routes/upload-temp';
import uploadSimpleRoutes from './routes/upload-simple';
import uploadDirectRoutes from './routes/upload-direct';
import uploadWorkingRoutes from './routes/upload-working';
import uploadFinalRoutes from './routes/upload-final';

const app: express.Application = express();

// EMERGENCY UPLOAD ENDPOINT - BEFORE ALL MIDDLEWARE
import multer from 'multer';
const uploadEmergency = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024, files: 5 }
});

// MIDDLEWARE GLOBAL CORS AGRESIVO PARA DESARROLLO
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

// ULTRA SIMPLE TEST ENDPOINT
app.get('/test-upload', (req: any, res: any) => {
  return res.json({ success: true, message: 'Upload endpoint works!' });
});

// SIMPLE UPLOAD WITHOUT MULTER FIRST
app.post('/simple-upload/:type', (req: any, res: any) => {
  return res.json({ 
    success: true, 
    message: 'Simple upload endpoint works',
    data: { files: [], urls: [] }
  });
});

// Security middleware - order is important
app.use(securityHeaders);
app.use(checkIPBlocking);
app.use(securityAuditLog);
app.use(requestSizeLimit('10mb'));

// CORS - Configuración mejorada para desarrollo
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como Postman, aplicaciones móviles, etc.)
    if (!origin) return callback(null, true);
    
    // En desarrollo, ser más permisivo
    if (config.nodeEnv === 'development') {
      // Permitir localhost en cualquier puerto
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }
    
    // Verificar origins configurados
    if (config.frontend.corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Rate limiting with enhanced security
app.use(apiRateLimit);

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Input validation and sanitization
app.use(sanitizeInput);
app.use(validateInput);

// Logging
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// Servir archivos estáticos (imágenes subidas) con CORS headers agresivos
app.use('/uploads', (req, res, next) => {
  // Headers CORS más agresivos para desarrollo
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Expose-Headers', '*');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  
  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
}, express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: config.apiVersion
  });
});

// Rutas de la API
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
app.use(`/api/${config.apiVersion}/upload`, uploadRoutes);
app.use(`/api/${config.apiVersion}/upload-temp`, uploadTempRoutes);
app.use(`/api/${config.apiVersion}/upload-simple`, uploadSimpleRoutes);
app.use(`/api/${config.apiVersion}/upload-direct`, uploadDirectRoutes);
app.use(`/api/${config.apiVersion}/upload-working`, uploadWorkingRoutes);
app.use(`/api/${config.apiVersion}/upload-final`, uploadFinalRoutes);

// DIRECT UPLOAD ENDPOINT - BYPASSING ROUTE SYSTEM
const uploadDirect = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024, files: 5 }
});

app.post(`/api/${config.apiVersion}/upload-direct-bypass/:type`, uploadDirect.array('images', 5), (req: any, res: any) => {
  try {
    const files = req.files;
    const { type } = req.params;
    
    if (!files || files.length === 0) {
      return res.json({ success: false, message: 'No files received' });
    }

    const uploadedFiles = files.map((file: any) => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: `/uploads/${file.filename}`
    }));

    return res.json({
      success: true,
      message: `${files.length} file(s) uploaded successfully`,
      data: { files: uploadedFiles, urls: uploadedFiles.map((f: any) => f.url) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Upload error' });
  }
});

app.get(`/api/${config.apiVersion}/upload-direct-bypass/:type`, (req: any, res: any) => {
  return res.json({ success: true, data: [] });
});

// Ruta principal de la API - Updated to force nodemon restart
app.use(`/api/${config.apiVersion}`, (req, res) => {
  res.json({
    message: 'API del Sistema de Gestión de Clínica de Belleza',
    version: config.apiVersion,
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
      upload: '/upload',
      'upload-simple': '/upload-simple',
      'upload-direct': '/upload-direct',
      'upload-working': '/upload-working',
      'upload-final': '/upload-final',
      'upload-direct-bypass': '/upload-direct-bypass'
    }
  });
});

// Middleware de manejo de errores
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Error:', err);

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido' });
  }

  return res.status(err.status || 500).json({
    error: config.nodeEnv === 'production' ? 'Error interno del servidor' : err.message
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

export default app;
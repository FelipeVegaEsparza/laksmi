import dotenv from 'dotenv';

dotenv.config();

// Log de variables de entorno cargadas
console.log('🔧 Cargando configuración del servidor...');
console.log(`   PORT: ${process.env.PORT || '3000 (default)'}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development (default)'}`);
console.log(`   DB_HOST: ${process.env.DB_HOST || 'localhost (default)'}`);
console.log(`   DB_NAME: ${process.env.DB_NAME || 'clinica_belleza (default)'}`);

const config = {
  // Servidor
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiVersion: process.env.API_VERSION || 'v1',

  // Base de datos
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    name: process.env.DB_NAME || 'clinica_belleza',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || ''
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-here',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  // Twilio
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_WHATSAPP_NUMBER || '',
    webhookUrl: process.env.TWILIO_WEBHOOK_URL || '',
    validateSignatures: process.env.TWILIO_VALIDATE_SIGNATURES !== 'false'
  },

  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4'
  },

  // Email
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASS || ''
  },

  // Archivos
  upload: {
    path: process.env.UPLOAD_PATH || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
    allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['image/jpeg', 'image/png', 'image/webp']
  },

  // Seguridad
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 min
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  },

  // URLs del frontend
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3001',
    dashboardUrl: process.env.DASHBOARD_URL || 'http://localhost:5173',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3001', 
      'http://localhost:5173', 
      'http://localhost:5174'
    ]
  }
};

export default config;
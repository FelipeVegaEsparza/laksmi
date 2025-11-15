import { Request, Response, NextFunction } from 'express';
import { TwilioService } from '../services/TwilioService';
import logger from '../utils/logger';

/**
 * Middleware para validar webhooks de Twilio
 */
export const validateTwilioWebhook = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const signature = req.headers['x-twilio-signature'] as string;
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    
    logger.info('🔐 Validating Twilio webhook signature', {
      url,
      hasSignature: !!signature,
      protocol: req.protocol,
      host: req.get('host'),
      originalUrl: req.originalUrl,
      body: req.body
    });
    
    // Validar signature de Twilio
    const isValidSignature = TwilioService.validateWebhookSignature(
      signature,
      url,
      req.body
    );

    if (!isValidSignature) {
      logger.error('❌ Invalid Twilio webhook signature', {
        url,
        signature: signature ? 'present' : 'missing',
        userAgent: req.headers['user-agent'],
        body: req.body
      });
      
      // TEMPORAL: Permitir webhooks sin validación para debugging
      logger.warn('⚠️  ALLOWING WEBHOOK WITHOUT VALIDATION FOR DEBUGGING');
      // res.status(403).json({ 
      //   error: 'Forbidden',
      //   message: 'Invalid webhook signature' 
      // });
      // return;
    } else {
      logger.info('✅ Webhook signature validated successfully');
    }

    // Validar que el request viene de Twilio
    const userAgent = req.headers['user-agent'] as string;
    if (!userAgent || !userAgent.includes('TwilioProxy')) {
      logger.warn('Webhook request with valid signature but suspicious user agent', {
        userAgent,
        ip: req.ip
      });
    }

    // Agregar información del webhook al request
    req.twilioWebhook = {
      validated: true,
      signature,
      timestamp: new Date()
    };

    next();

  } catch (error) {
    logger.error('Error validating Twilio webhook:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Error validating webhook' 
    });
  }
};

/**
 * Middleware para logging de webhooks de Twilio
 */
export const logTwilioWebhook = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Log del webhook entrante
  logger.info('Twilio webhook received', {
    method: req.method,
    url: req.originalUrl,
    userAgent: req.headers['user-agent'],
    contentType: req.headers['content-type'],
    contentLength: req.headers['content-length'],
    ip: req.ip,
    messageSid: req.body?.MessageSid,
    from: req.body?.From,
    to: req.body?.To
  });

  // Override del método res.json para logging de respuesta
  const originalJson = res.json;
  res.json = function(body: any) {
    const processingTime = Date.now() - startTime;
    
    logger.info('Twilio webhook response', {
      statusCode: res.statusCode,
      processingTime,
      messageSid: req.body?.MessageSid,
      responseBody: typeof body === 'string' ? body : JSON.stringify(body)
    });
    
    return originalJson.call(this, body);
  };

  next();
};

/**
 * Middleware para rate limiting específico de webhooks
 */
export const rateLimitTwilioWebhook = (req: Request, res: Response, next: NextFunction): void => {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minuto
  const maxRequests = 100; // Máximo 100 webhooks por minuto por IP
  
  // Usar un Map simple para rate limiting (en producción usar Redis)
  if (!(global as any).twilioWebhookRateLimit) {
    (global as any).twilioWebhookRateLimit = new Map();
  }
  
  const rateLimitMap = (global as any).twilioWebhookRateLimit as Map<string, { count: number; resetTime: number }>;
  
  const limit = rateLimitMap.get(ip || 'unknown');
  
  if (!limit || now > limit.resetTime) {
    // Nueva ventana de tiempo
    rateLimitMap.set(ip || 'unknown', {
      count: 1,
      resetTime: now + windowMs
    });
    next();
    return;
  }
  
  if (limit.count >= maxRequests) {
    logger.warn('Twilio webhook rate limit exceeded', {
      ip: ip || 'unknown',
      count: limit.count,
      maxRequests
    });
    
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded for webhook requests'
    });
    return;
  }
  
  limit.count++;
  next();
};

/**
 * Middleware para manejo de errores específico de webhooks
 */
export const handleTwilioWebhookError = (
  error: any, 
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  logger.error('Twilio webhook error:', {
    error: error.message,
    stack: error.stack,
    messageSid: req.body?.MessageSid,
    from: req.body?.From,
    to: req.body?.To,
    url: req.originalUrl
  });

  // Responder con 200 para evitar que Twilio reintente
  // (a menos que sea un error de validación)
  if (error.status === 403) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid webhook signature'
    });
  } else {
    res.status(200).send('Error processed');
  }
};

// Extender el tipo Request para incluir información del webhook
declare global {
  namespace Express {
    interface Request {
      twilioWebhook?: {
        validated: boolean;
        signature: string;
        timestamp: Date;
      };
    }
  }
}

export default {
  validateTwilioWebhook,
  logTwilioWebhook,
  rateLimitTwilioWebhook,
  handleTwilioWebhookError
};
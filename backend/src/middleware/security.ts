import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import ExpressBrute from 'express-brute';
import ExpressBruteRedis from 'express-brute-redis';
import helmet from 'helmet';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import validator from 'validator';
import logger from '../utils/logger';
// Initialize DOMPurify with JSDOM
const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Brute force protection for login attempts (using memory store for development)
let bruteStore: any;

try {
  // Try to use Redis if available
  const { getRedisClient } = require('../config/redis');
  const redisClient = getRedisClient();
  bruteStore = new ExpressBruteRedis({
    client: redisClient,
    prefix: 'brute:'
  });
} catch (error) {
  // Fallback to memory store if Redis is not available
  console.log('Redis not available, using memory store for brute force protection');
  bruteStore = new ExpressBrute.MemoryStore();
}

export const loginBruteForce = new ExpressBrute(bruteStore, {
  freeRetries: 5,
  minWait: 5 * 60 * 1000, // 5 minutes
  maxWait: 60 * 60 * 1000, // 1 hour
  lifetime: 24 * 60 * 60, // 24 hours
  failCallback: (req: Request, res: Response, next: NextFunction) => {
    logger.warn(`Brute force attack detected from IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many failed login attempts. Please try again later.',
      retryAfter: '5 minutes'
    });
  }
});

// General API rate limiting (AJUSTADO PARA DESARROLLO)
export const apiRateLimit = rateLimit({
  windowMs: process.env.NODE_ENV === 'development' ? 1 * 60 * 1000 : 15 * 60 * 1000, // 1 min dev, 15 min prod
  max: process.env.NODE_ENV === 'development' ? 1000 : 500, // 1000 req/min dev, 500 req/15min prod
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting for localhost in development
    return process.env.NODE_ENV === 'development' && 
           (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === 'localhost');
  },
  handler: (req: Request, res: Response) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}, User-Agent: ${req.get('User-Agent')}`);
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// Strict rate limiting for authentication endpoints (more permissive for development)
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 100 : 10, // More attempts in development
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting for localhost in development
    return process.env.NODE_ENV === 'development' && 
           (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === 'localhost');
  }
});

// Rate limiting for WhatsApp webhook
export const webhookRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 webhook requests per minute
  message: {
    error: 'Webhook rate limit exceeded',
    retryAfter: '1 minute'
  },
  skip: (req: Request) => {
    // Skip rate limiting for verified Twilio requests
    return req.headers['x-twilio-signature'] !== undefined;
  }
});

// Slow down middleware for suspicious activity
export const speedLimiter: any = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per windowMs without delay
  delayMs: () => 500, // add 500ms delay per request after delayAfter (new format)
  maxDelayMs: 20000, // maximum delay of 20 seconds
  validate: {
    delayMs: false // disable the warning
  }
});

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: process.env.NODE_ENV === 'development' 
        ? ["'self'", "data:", "https:", "http:", "http://localhost:*"] // Permitir http en desarrollo
        : ["'self'", "data:", "https:"], // Solo https en producción
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }

    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    logger.error('Input sanitization failed:', error);
    res.status(400).json({ error: 'Invalid input data' });
  }
};

// Recursive object sanitization
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const sanitizedKey = sanitizeString(key);
        sanitized[sanitizedKey] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
}

// String sanitization
function sanitizeString(str: string): string {
  if (typeof str !== 'string') {
    return str;
  }

  // Remove HTML tags and potentially dangerous content
  let sanitized = purify.sanitize(str, { ALLOWED_TAGS: [] });
  
  // Escape special characters
  sanitized = validator.escape(sanitized);
  
  // Remove null bytes and other control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  return sanitized;
}

// Input validation middleware
export const validateInput = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Validate common fields
    if (req.body.email && !validator.isEmail(req.body.email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    if (req.body.phone && !validator.isMobilePhone(req.body.phone, 'any')) {
      res.status(400).json({ error: 'Invalid phone number format' });
      return;
    }

    if (req.body.url && !validator.isURL(req.body.url)) {
      res.status(400).json({ error: 'Invalid URL format' });
      return;
    }

    // Check for SQL injection patterns
    const sqlInjectionPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i;
    const checkForSQLInjection = (value: any): boolean => {
      if (typeof value === 'string') {
        return sqlInjectionPattern.test(value);
      }
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(checkForSQLInjection);
      }
      return false;
    };

    if (checkForSQLInjection(req.body) || checkForSQLInjection(req.query)) {
      logger.warn(`SQL injection attempt detected from IP: ${req.ip}`);
      res.status(400).json({ error: 'Invalid input detected' });
      return;
    }

    next();
  } catch (error) {
    logger.error('Input validation failed:', error);
    res.status(400).json({ error: 'Validation error' });
  }
};

// IP whitelist middleware (for admin endpoints)
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
    
    if (!allowedIPs.includes(clientIP)) {
      logger.warn(`Unauthorized IP access attempt: ${clientIP}`);
      res.status(403).json({ error: 'Access denied from this IP address' });
      return;
    }
    
    next();
  };
};

// Request size limiter
export const requestSizeLimit = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = req.get('content-length');
    if (contentLength && parseInt(contentLength) > parseSize(maxSize)) {
      logger.warn(`Request size limit exceeded: ${contentLength} bytes from IP: ${req.ip}`);
      res.status(413).json({ error: 'Request entity too large' });
      return;
    }
    next();
  };
};

// Helper function to parse size strings
function parseSize(size: string): number {
  const units: { [key: string]: number } = {
    'b': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024
  };
  
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([a-z]+)?$/);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';
  
  return value * (units[unit] || 1);
}

// Security audit logging middleware
export const securityAuditLog = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log security-relevant request information
  const auditData = {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    method: req.method,
    url: req.originalUrl,
    headers: {
      authorization: req.get('Authorization') ? '[REDACTED]' : undefined,
      'x-forwarded-for': req.get('X-Forwarded-For'),
      'x-real-ip': req.get('X-Real-IP')
    }
  };

  // Override res.json to log response status
  const originalJson = res.json;
  res.json = function(body: any) {
    const responseTime = Date.now() - startTime;
    
    logger.info('Security audit log', {
      ...auditData,
      statusCode: res.statusCode,
      responseTime,
      success: res.statusCode < 400
    });

    // Log failed authentication attempts
    if (res.statusCode === 401 || res.statusCode === 403) {
      logger.warn('Authentication/Authorization failure', {
        ...auditData,
        statusCode: res.statusCode,
        responseTime
      });
    }

    return originalJson.call(this, body);
  };

  next();
};
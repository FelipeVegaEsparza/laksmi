import { Request, Response, NextFunction } from 'express';
import { SecurityAuditService } from '../services/SecurityAuditService';
import logger from '../utils/logger';

/**
 * Middleware to check if an IP is blocked
 */
export const checkIPBlocking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
    
    const isBlocked = await SecurityAuditService.isIPBlocked(clientIP);
    
    if (isBlocked) {
      logger.warn(`Blocked IP attempted access: ${clientIP}`);
      
      await SecurityAuditService.logSecurityEvent({
        type: 'UNAUTHORIZED_ACCESS',
        ip: clientIP,
        userAgent: req.get('User-Agent'),
        resource: req.originalUrl,
        severity: 'HIGH',
        details: {
          reason: 'IP_BLOCKED',
          method: req.method
        }
      });

      res.status(403).json({
        error: 'Access denied. Your IP address has been temporarily blocked due to suspicious activity.',
        code: 'IP_BLOCKED'
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Error checking IP blocking:', error);
    // Don't block on error, just log and continue
    next();
  }
};
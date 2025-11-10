import { Request, Response } from 'express';
import { SecurityAuditService } from '../services/SecurityAuditService';
import { AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';

export class SecurityController {
  /**
   * Get security statistics and metrics
   */
  static async getSecurityStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = await SecurityAuditService.getSecurityStats();
      
      res.json({
        success: true,
        message: 'Security statistics retrieved successfully',
        data: stats
      });
    } catch (error: any) {
      logger.error('Error getting security stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve security statistics'
      });
    }
  }

  /**
   * Get security events for a specific IP
   */
  static async getSecurityEventsForIP(req: Request, res: Response): Promise<void> {
    try {
      const { ip } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      
      if (!ip) {
        res.status(400).json({
          success: false,
          error: 'IP address is required'
        });
        return;
      }

      const events = await SecurityAuditService.getSecurityEventsForIP(ip, limit);
      
      res.json({
        success: true,
        message: 'Security events retrieved successfully',
        data: {
          ip,
          events,
          count: events.length
        }
      });
    } catch (error: any) {
      logger.error('Error getting security events for IP:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve security events'
      });
    }
  }

  /**
   * Manually block an IP address
   */
  static async blockIP(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { ip, reason } = req.body;
      
      if (!ip) {
        res.status(400).json({
          success: false,
          error: 'IP address is required'
        });
        return;
      }

      // Log the manual block action
      await SecurityAuditService.logSecurityEvent({
        type: 'ADMIN_ACTION',
        userId: req.user?.userId,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent'),
        severity: 'HIGH',
        details: {
          action: 'MANUAL_IP_BLOCK',
          targetIP: ip,
          reason: reason || 'Manual block by admin'
        }
      });

      // Block the IP by creating a suspicious activity event
      await SecurityAuditService.logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        ip: ip,
        severity: 'CRITICAL',
        details: {
          reason: 'MANUAL_BLOCK',
          blockedBy: req.user?.username,
          adminReason: reason
        }
      });

      res.json({
        success: true,
        message: `IP ${ip} has been blocked successfully`
      });
    } catch (error: any) {
      logger.error('Error blocking IP:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to block IP address'
      });
    }
  }

  /**
   * Check if an IP is currently blocked
   */
  static async checkIPStatus(req: Request, res: Response): Promise<void> {
    try {
      const { ip } = req.params;
      
      if (!ip) {
        res.status(400).json({
          success: false,
          error: 'IP address is required'
        });
        return;
      }

      const isBlocked = await SecurityAuditService.isIPBlocked(ip);
      
      res.json({
        success: true,
        message: 'IP status retrieved successfully',
        data: {
          ip,
          isBlocked,
          status: isBlocked ? 'blocked' : 'allowed'
        }
      });
    } catch (error: any) {
      logger.error('Error checking IP status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check IP status'
      });
    }
  }

  /**
   * Get recent security events (for dashboard monitoring)
   */
  static async getRecentSecurityEvents(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const severity = req.query.severity as string;
      
      // This is a simplified implementation
      // In production, you might want to implement more sophisticated filtering
      const stats = await SecurityAuditService.getSecurityStats();
      
      res.json({
        success: true,
        message: 'Recent security events retrieved successfully',
        data: {
          summary: stats,
          // Note: This would need to be implemented to return actual recent events
          // For now, we return the stats as a placeholder
          events: []
        }
      });
    } catch (error: any) {
      logger.error('Error getting recent security events:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve recent security events'
      });
    }
  }

  /**
   * Cleanup old security events
   */
  static async cleanupSecurityEvents(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await SecurityAuditService.cleanupOldEvents();
      
      // Log the cleanup action
      await SecurityAuditService.logSecurityEvent({
        type: 'ADMIN_ACTION',
        userId: req.user?.userId,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent'),
        severity: 'LOW',
        details: {
          action: 'SECURITY_EVENTS_CLEANUP'
        }
      });

      res.json({
        success: true,
        message: 'Security events cleanup completed successfully'
      });
    } catch (error: any) {
      logger.error('Error cleaning up security events:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cleanup security events'
      });
    }
  }
}
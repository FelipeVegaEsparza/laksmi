import logger from '../utils/logger';

let redisClient: any = null;

// Initialize Redis client lazily
const getRedisClient = () => {
  if (!redisClient) {
    try {
      const { getRedisClient: getClient } = require('../config/redis');
      redisClient = getClient();
    } catch (error) {
      logger.warn('Redis not available for SecurityAuditService, using fallback methods');
      redisClient = null;
    }
  }
  return redisClient;
};

export interface SecurityEvent {
  type: 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'UNAUTHORIZED_ACCESS' | 'RATE_LIMIT_EXCEEDED' | 
        'SUSPICIOUS_ACTIVITY' | 'DATA_ACCESS' | 'DATA_MODIFICATION' | 'ADMIN_ACTION' |
        'ENCRYPTION_ERROR' | 'VALIDATION_ERROR' | 'SQL_INJECTION_ATTEMPT' | 'XSS_ATTEMPT';
  userId?: string;
  ip: string;
  userAgent?: string;
  resource?: string;
  details?: any;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: Date;
}

export class SecurityAuditService {
  private static readonly REDIS_KEY_PREFIX = 'security_audit:';
  private static readonly SUSPICIOUS_THRESHOLD = 5; // Number of suspicious events before alert
  private static readonly TIME_WINDOW = 300; // 5 minutes in seconds

  /**
   * Log a security event
   */
  static async logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): Promise<void> {
    try {
      const fullEvent: SecurityEvent = {
        ...event,
        timestamp: new Date()
      };

      // Log to Winston
      logger.warn('Security Event', fullEvent);

      // Store in Redis for real-time monitoring
      await this.storeEventInRedis(fullEvent);

      // Check for suspicious patterns
      await this.checkSuspiciousActivity(event.ip, event.type);

      // Send alerts for critical events
      if (event.severity === 'CRITICAL') {
        await this.sendCriticalAlert(fullEvent);
      }

    } catch (error) {
      logger.error('Failed to log security event:', error);
    }
  }

  /**
   * Store security event in Redis for real-time monitoring
   */
  private static async storeEventInRedis(event: SecurityEvent): Promise<void> {
    try {
      const client = getRedisClient();
      if (!client) {
        // Fallback: just log the event
        logger.info('Security event (Redis unavailable):', event);
        return;
      }

      const key = `${this.REDIS_KEY_PREFIX}${event.ip}:${Date.now()}`;
      await client.setEx(key, 3600, JSON.stringify(event)); // Store for 1 hour

      // Maintain a sorted set of events by IP for pattern detection
      const ipKey = `${this.REDIS_KEY_PREFIX}ip:${event.ip}`;
      await client.zAdd(ipKey, {
        score: Date.now(),
        value: JSON.stringify(event)
      });
      await client.expire(ipKey, this.TIME_WINDOW);

    } catch (error) {
      logger.error('Failed to store security event in Redis:', error);
    }
  }

  /**
   * Check for suspicious activity patterns
   */
  private static async checkSuspiciousActivity(ip: string, eventType: SecurityEvent['type']): Promise<void> {
    try {
      const client = getRedisClient();
      if (!client) {
        // Without Redis, we can't track patterns, so just log
        logger.debug(`Suspicious activity check skipped for ${ip} (Redis unavailable)`);
        return;
      }

      const ipKey = `${this.REDIS_KEY_PREFIX}ip:${ip}`;
      const now = Date.now();
      const windowStart = now - (this.TIME_WINDOW * 1000);

      // Get events in the time window
      const events = await client.zRangeByScore(ipKey, windowStart, now);
      
      if (events.length >= this.SUSPICIOUS_THRESHOLD) {
        await this.logSecurityEvent({
          type: 'SUSPICIOUS_ACTIVITY',
          ip,
          severity: 'HIGH',
          details: {
            eventCount: events.length,
            timeWindow: this.TIME_WINDOW,
            triggeringEvent: eventType
          }
        });

        // Temporarily block IP
        await this.temporarilyBlockIP(ip);
      }

    } catch (error) {
      logger.error('Failed to check suspicious activity:', error);
    }
  }

  /**
   * Temporarily block an IP address
   */
  private static async temporarilyBlockIP(ip: string): Promise<void> {
    try {
      const client = getRedisClient();
      if (!client) {
        logger.warn(`IP ${ip} would be blocked (Redis unavailable)`);
        return;
      }

      const blockKey = `${this.REDIS_KEY_PREFIX}blocked:${ip}`;
      await client.setEx(blockKey, 3600, 'blocked'); // Block for 1 hour
      
      logger.warn(`IP ${ip} temporarily blocked due to suspicious activity`);
      
    } catch (error) {
      logger.error('Failed to block IP:', error);
    }
  }

  /**
   * Check if an IP is blocked
   */
  static async isIPBlocked(ip: string): Promise<boolean> {
    try {
      const client = getRedisClient();
      if (!client) {
        // Without Redis, no IPs are blocked
        return false;
      }

      const blockKey = `${this.REDIS_KEY_PREFIX}blocked:${ip}`;
      const blocked = await client.get(blockKey);
      return blocked === 'blocked';
    } catch (error) {
      logger.error('Failed to check IP block status:', error);
      return false;
    }
  }

  /**
   * Send critical security alerts
   */
  private static async sendCriticalAlert(event: SecurityEvent): Promise<void> {
    try {
      // Log critical alert
      logger.error('CRITICAL SECURITY ALERT', {
        event,
        alertTime: new Date().toISOString()
      });

      // Here you could integrate with external alerting systems
      // like Slack, email notifications, SMS, etc.
      
    } catch (error) {
      logger.error('Failed to send critical alert:', error);
    }
  }

  /**
   * Get security events for an IP address
   */
  static async getSecurityEventsForIP(ip: string, limit: number = 50): Promise<SecurityEvent[]> {
    try {
      const client = getRedisClient();
      if (!client) {
        logger.debug(`Cannot get security events for IP ${ip} (Redis unavailable)`);
        return [];
      }

      const ipKey = `${this.REDIS_KEY_PREFIX}ip:${ip}`;
      const events = await client.zRevRange(ipKey, 0, limit - 1);
      
      return events.map((eventStr: string) => JSON.parse(eventStr) as SecurityEvent);
    } catch (error) {
      logger.error('Failed to get security events for IP:', error);
      return [];
    }
  }

  /**
   * Get security statistics
   */
  static async getSecurityStats(): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    blockedIPs: number;
    criticalEvents: number;
  }> {
    try {
      const client = getRedisClient();
      if (!client) {
        // Return default stats when Redis is unavailable
        return {
          totalEvents: 0,
          eventsByType: {},
          blockedIPs: 0,
          criticalEvents: 0
        };
      }

      // This is a simplified implementation
      // In production, you might want to use a more sophisticated approach
      const keys = await client.keys(`${this.REDIS_KEY_PREFIX}*`);
      
      const stats = {
        totalEvents: 0,
        eventsByType: {} as Record<string, number>,
        blockedIPs: 0,
        criticalEvents: 0
      };

      for (const key of keys) {
        if (key.includes('blocked:')) {
          stats.blockedIPs++;
        } else if (key.includes('ip:')) {
          const events = await client.zRange(key, 0, -1);
          stats.totalEvents += events.length;
          
          for (const eventStr of events) {
            try {
              const event = JSON.parse(eventStr) as SecurityEvent;
              stats.eventsByType[event.type] = (stats.eventsByType[event.type] || 0) + 1;
              if (event.severity === 'CRITICAL') {
                stats.criticalEvents++;
              }
            } catch (parseError) {
              // Skip invalid events
            }
          }
        }
      }

      return stats;
    } catch (error) {
      logger.error('Failed to get security stats:', error);
      return {
        totalEvents: 0,
        eventsByType: {},
        blockedIPs: 0,
        criticalEvents: 0
      };
    }
  }

  /**
   * Clean up old security events
   */
  static async cleanupOldEvents(): Promise<void> {
    try {
      const client = getRedisClient();
      if (!client) {
        logger.debug('Security events cleanup skipped (Redis unavailable)');
        return;
      }

      const keys = await client.keys(`${this.REDIS_KEY_PREFIX}*`);
      const now = Date.now();
      const cutoff = now - (24 * 60 * 60 * 1000); // 24 hours ago

      for (const key of keys) {
        if (key.includes('ip:')) {
          // Remove events older than 24 hours
          await client.zRemRangeByScore(key, 0, cutoff);
        }
      }

      logger.info('Security events cleanup completed');
    } catch (error) {
      logger.error('Failed to cleanup old security events:', error);
    }
  }
}
import { Request, Response } from 'express';
import { ConsentService } from '../services/ConsentService';
import { DataRetentionService } from '../services/DataRetentionService';
import { SecurityAuditService } from '../services/SecurityAuditService';
import { AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';

export class GDPRController {
  /**
   * Record consent decision
   */
  static async recordConsent(req: Request, res: Response): Promise<void> {
    try {
      const {
        clientId,
        consentType,
        granted,
        source,
        legalBasis,
        purpose,
        dataCategories,
        retentionPeriod
      } = req.body;

      const consentRecord = await ConsentService.recordConsent({
        clientId,
        consentType,
        granted,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent'),
        source,
        legalBasis,
        purpose,
        dataCategories,
        retentionPeriod
      });

      // Log the consent action
      await SecurityAuditService.logSecurityEvent({
        type: 'DATA_ACCESS',
        userId: (req as AuthenticatedRequest).user?.userId,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent'),
        severity: 'LOW',
        details: {
          action: 'CONSENT_RECORDED',
          clientId,
          consentType,
          granted
        }
      });

      res.json({
        success: true,
        message: 'Consent recorded successfully',
        data: consentRecord
      });
    } catch (error: any) {
      logger.error('Error recording consent:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to record consent'
      });
    }
  }

  /**
   * Get client consent status
   */
  static async getConsentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { clientId } = req.params;

      const consentSummary = await ConsentService.getConsentSummary(clientId);
      const consentHistory = await ConsentService.getClientConsents(clientId);

      res.json({
        success: true,
        message: 'Consent status retrieved successfully',
        data: {
          clientId,
          currentConsents: consentSummary,
          consentHistory
        }
      });
    } catch (error: any) {
      logger.error('Error getting consent status:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get consent status'
      });
    }
  }

  /**
   * Revoke consent
   */
  static async revokeConsent(req: Request, res: Response): Promise<void> {
    try {
      const { clientId, consentType } = req.body;

      await ConsentService.revokeConsent(
        clientId,
        consentType,
        req.ip || 'unknown',
        req.get('User-Agent')
      );

      // Log the consent revocation
      await SecurityAuditService.logSecurityEvent({
        type: 'DATA_MODIFICATION',
        userId: (req as AuthenticatedRequest).user?.userId,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent'),
        severity: 'MEDIUM',
        details: {
          action: 'CONSENT_REVOKED',
          clientId,
          consentType
        }
      });

      res.json({
        success: true,
        message: 'Consent revoked successfully'
      });
    } catch (error: any) {
      logger.error('Error revoking consent:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to revoke consent'
      });
    }
  }

  /**
   * Request data export (Right to data portability)
   */
  static async requestDataExport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { clientId } = req.body;

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const exportRequest = await DataRetentionService.exportClientData(
        clientId,
        req.user.username
      );

      // Log the data export request
      await SecurityAuditService.logSecurityEvent({
        type: 'DATA_ACCESS',
        userId: req.user.userId,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent'),
        severity: 'HIGH',
        details: {
          action: 'DATA_EXPORT_REQUESTED',
          clientId,
          requestId: exportRequest.clientId
        }
      });

      res.json({
        success: true,
        message: 'Data export completed successfully',
        data: exportRequest
      });
    } catch (error: any) {
      logger.error('Error requesting data export:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to export data'
      });
    }
  }

  /**
   * Request data deletion (Right to be forgotten)
   */
  static async requestDataDeletion(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { clientId, reason } = req.body;

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const deletionResult = await DataRetentionService.deleteClientData(
        clientId,
        req.user.username,
        reason
      );

      // Log the data deletion request
      await SecurityAuditService.logSecurityEvent({
        type: 'DATA_MODIFICATION',
        userId: req.user.userId,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent'),
        severity: 'CRITICAL',
        details: {
          action: 'DATA_DELETION_REQUESTED',
          clientId,
          reason,
          deletedRecords: deletionResult.deletedRecords,
          retainedRecords: deletionResult.retainedRecords
        }
      });

      res.json({
        success: true,
        message: 'Data deletion processed successfully',
        data: deletionResult
      });
    } catch (error: any) {
      logger.error('Error requesting data deletion:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete data'
      });
    }
  }

  /**
   * Get data retention policies
   */
  static async getRetentionPolicies(req: Request, res: Response): Promise<void> {
    try {
      const policies = DataRetentionService.getRetentionPolicies();

      res.json({
        success: true,
        message: 'Data retention policies retrieved successfully',
        data: policies
      });
    } catch (error: any) {
      logger.error('Error getting retention policies:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get retention policies'
      });
    }
  }

  /**
   * Process data retention (cleanup expired data)
   */
  static async processDataRetention(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const results = await DataRetentionService.processDataRetention();

      // Log the data retention processing
      await SecurityAuditService.logSecurityEvent({
        type: 'ADMIN_ACTION',
        userId: req.user.userId,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent'),
        severity: 'MEDIUM',
        details: {
          action: 'DATA_RETENTION_PROCESSED',
          results
        }
      });

      res.json({
        success: true,
        message: 'Data retention processing completed',
        data: results
      });
    } catch (error: any) {
      logger.error('Error processing data retention:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to process data retention'
      });
    }
  }

  /**
   * Get data export requests history
   */
  static async getDataExportRequests(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const requests = await DataRetentionService.getDataExportRequests(limit);

      res.json({
        success: true,
        message: 'Data export requests retrieved successfully',
        data: requests
      });
    } catch (error: any) {
      logger.error('Error getting data export requests:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get data export requests'
      });
    }
  }

  /**
   * Get data deletion requests history
   */
  static async getDataDeletionRequests(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const requests = await DataRetentionService.getDataDeletionRequests(limit);

      res.json({
        success: true,
        message: 'Data deletion requests retrieved successfully',
        data: requests
      });
    } catch (error: any) {
      logger.error('Error getting data deletion requests:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get data deletion requests'
      });
    }
  }

  /**
   * Request WhatsApp consent
   */
  static async requestWhatsAppConsent(req: Request, res: Response): Promise<void> {
    try {
      const { clientId, phoneNumber } = req.body;

      const consentToken = await ConsentService.requestWhatsAppConsent(clientId, phoneNumber);

      res.json({
        success: true,
        message: 'WhatsApp consent request created successfully',
        data: {
          consentToken,
          message: 'Consent request sent to client via WhatsApp'
        }
      });
    } catch (error: any) {
      logger.error('Error requesting WhatsApp consent:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to request WhatsApp consent'
      });
    }
  }

  /**
   * Process WhatsApp consent response
   */
  static async processWhatsAppConsentResponse(req: Request, res: Response): Promise<void> {
    try {
      const { consentToken, granted } = req.body;

      const success = await ConsentService.processWhatsAppConsentResponse(
        consentToken,
        granted,
        req.ip || 'unknown'
      );

      res.json({
        success,
        message: success ? 'Consent response processed successfully' : 'Failed to process consent response'
      });
    } catch (error: any) {
      logger.error('Error processing WhatsApp consent response:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to process consent response'
      });
    }
  }

  /**
   * Cleanup expired consent requests
   */
  static async cleanupExpiredConsents(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await ConsentService.cleanupExpiredConsents();

      if (req.user) {
        await SecurityAuditService.logSecurityEvent({
          type: 'ADMIN_ACTION',
          userId: req.user.userId,
          ip: req.ip || 'unknown',
          userAgent: req.get('User-Agent'),
          severity: 'LOW',
          details: {
            action: 'EXPIRED_CONSENTS_CLEANUP'
          }
        });
      }

      res.json({
        success: true,
        message: 'Expired consent requests cleaned up successfully'
      });
    } catch (error: any) {
      logger.error('Error cleaning up expired consents:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cleanup expired consents'
      });
    }
  }
}
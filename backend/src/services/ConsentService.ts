import db from '../config/database';
import logger from '../utils/logger';
import { EncryptionService } from './EncryptionService';

export interface ConsentRecord {
  id: string;
  clientId: string;
  consentType: 'WHATSAPP_COMMUNICATION' | 'DATA_PROCESSING' | 'MARKETING' | 'ANALYTICS';
  granted: boolean;
  grantedAt?: Date;
  revokedAt?: Date;
  ipAddress: string;
  userAgent?: string;
  source: 'WEB' | 'WHATSAPP' | 'ADMIN';
  legalBasis: 'CONSENT' | 'CONTRACT' | 'LEGITIMATE_INTEREST' | 'LEGAL_OBLIGATION';
  purpose: string;
  dataCategories: string[];
  retentionPeriod: number; // in days
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsentRequest {
  clientId: string;
  consentType: ConsentRecord['consentType'];
  granted: boolean;
  ipAddress: string;
  userAgent?: string;
  source: ConsentRecord['source'];
  legalBasis: ConsentRecord['legalBasis'];
  purpose: string;
  dataCategories: string[];
  retentionPeriod: number;
}

export class ConsentService {
  /**
   * Record a consent decision
   */
  static async recordConsent(consentData: ConsentRequest): Promise<ConsentRecord> {
    try {
      const consentRecord: Partial<ConsentRecord> = {
        id: this.generateConsentId(),
        clientId: consentData.clientId,
        consentType: consentData.consentType,
        granted: consentData.granted,
        grantedAt: consentData.granted ? new Date() : undefined,
        revokedAt: !consentData.granted ? new Date() : undefined,
        ipAddress: EncryptionService.encrypt(consentData.ipAddress),
        userAgent: consentData.userAgent ? EncryptionService.encrypt(consentData.userAgent) : undefined,
        source: consentData.source,
        legalBasis: consentData.legalBasis,
        purpose: consentData.purpose,
        dataCategories: consentData.dataCategories,
        retentionPeriod: consentData.retentionPeriod,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db('consent_records').insert(consentRecord);
      
      logger.info('Consent recorded', {
        clientId: consentData.clientId,
        consentType: consentData.consentType,
        granted: consentData.granted
      });

      return consentRecord as ConsentRecord;
    } catch (error) {
      logger.error('Error recording consent:', error);
      throw new Error('Failed to record consent');
    }
  }

  /**
   * Check if client has given consent for a specific purpose
   */
  static async hasConsent(clientId: string, consentType: ConsentRecord['consentType']): Promise<boolean> {
    try {
      const latestConsent = await db('consent_records')
        .where({ clientId, consentType })
        .orderBy('createdAt', 'desc')
        .first();

      return latestConsent ? latestConsent.granted : false;
    } catch (error) {
      logger.error('Error checking consent:', error);
      return false;
    }
  }

  /**
   * Get all consents for a client
   */
  static async getClientConsents(clientId: string): Promise<ConsentRecord[]> {
    try {
      const consents = await db('consent_records')
        .where({ clientId })
        .orderBy('createdAt', 'desc');

      return consents.map(consent => ({
        ...consent,
        ipAddress: EncryptionService.decrypt(consent.ipAddress),
        userAgent: consent.userAgent ? EncryptionService.decrypt(consent.userAgent) : undefined,
        dataCategories: JSON.parse(consent.dataCategories)
      }));
    } catch (error) {
      logger.error('Error getting client consents:', error);
      throw new Error('Failed to retrieve client consents');
    }
  }

  /**
   * Revoke consent for a specific type
   */
  static async revokeConsent(
    clientId: string, 
    consentType: ConsentRecord['consentType'],
    ipAddress: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await this.recordConsent({
        clientId,
        consentType,
        granted: false,
        ipAddress,
        userAgent,
        source: 'WEB',
        legalBasis: 'CONSENT',
        purpose: 'Consent revocation',
        dataCategories: [],
        retentionPeriod: 0
      });

      logger.info('Consent revoked', { clientId, consentType });
    } catch (error) {
      logger.error('Error revoking consent:', error);
      throw new Error('Failed to revoke consent');
    }
  }

  /**
   * Get consent status summary for a client
   */
  static async getConsentSummary(clientId: string): Promise<Record<string, boolean>> {
    try {
      const consentTypes: ConsentRecord['consentType'][] = [
        'WHATSAPP_COMMUNICATION',
        'DATA_PROCESSING',
        'MARKETING',
        'ANALYTICS'
      ];

      const summary: Record<string, boolean> = {};

      for (const type of consentTypes) {
        summary[type] = await this.hasConsent(clientId, type);
      }

      return summary;
    } catch (error) {
      logger.error('Error getting consent summary:', error);
      throw new Error('Failed to get consent summary');
    }
  }

  /**
   * Request WhatsApp consent from client
   */
  static async requestWhatsAppConsent(clientId: string, phoneNumber: string): Promise<string> {
    try {
      // Generate a consent token for tracking
      const consentToken = EncryptionService.generateSecureToken();
      
      // Store pending consent request
      await db('pending_consents').insert({
        id: this.generateConsentId(),
        clientId,
        consentToken,
        consentType: 'WHATSAPP_COMMUNICATION',
        phoneNumber: EncryptionService.encryptPhone(phoneNumber),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        created_at: new Date()
      });

      return consentToken;
    } catch (error) {
      logger.error('Error requesting WhatsApp consent:', error);
      throw new Error('Failed to request WhatsApp consent');
    }
  }

  /**
   * Process consent response from WhatsApp
   */
  static async processWhatsAppConsentResponse(
    consentToken: string,
    granted: boolean,
    ipAddress: string
  ): Promise<boolean> {
    try {
      const pendingConsent = await db('pending_consents')
        .where({ consentToken })
        .where('expires_at', '>', new Date())
        .first();

      if (!pendingConsent) {
        throw new Error('Invalid or expired consent token');
      }

      // Record the consent decision
      await this.recordConsent({
        clientId: pendingConsent.clientId,
        consentType: 'WHATSAPP_COMMUNICATION',
        granted,
        ipAddress,
        source: 'WHATSAPP',
        legalBasis: 'CONSENT',
        purpose: 'WhatsApp communication and customer service',
        dataCategories: ['contact_information', 'communication_history'],
        retentionPeriod: 1095 // 3 years
      });

      // Remove pending consent
      await db('pending_consents').where({ consentToken }).del();

      return true;
    } catch (error) {
      logger.error('Error processing WhatsApp consent response:', error);
      throw new Error('Failed to process consent response');
    }
  }

  /**
   * Generate unique consent ID
   */
  private static generateConsentId(): string {
    return `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up expired pending consents
   */
  static async cleanupExpiredConsents(): Promise<void> {
    try {
      const deleted = await db('pending_consents')
        .where('expires_at', '<', new Date())
        .del();

      if (deleted > 0) {
        logger.info(`Cleaned up ${deleted} expired consent requests`);
      }
    } catch (error) {
      logger.error('Error cleaning up expired consents:', error);
    }
  }
}
import db from '../config/database';
import logger from '../utils/logger';
import { ConsentService } from './ConsentService';

export interface RetentionPolicy {
  dataType: string;
  retentionPeriodDays: number;
  legalBasis: string;
  description: string;
  autoDelete: boolean;
}

export interface DataExportRequest {
  clientId: string;
  requestedBy: string;
  requestDate: Date;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  exportData?: any;
  completedAt?: Date;
}

export class DataRetentionService {
  private static readonly RETENTION_POLICIES: RetentionPolicy[] = [
    {
      dataType: 'client_personal_data',
      retentionPeriodDays: 1095, // 3 years
      legalBasis: 'Contract performance and legitimate interest',
      description: 'Client personal information for service delivery',
      autoDelete: false
    },
    {
      dataType: 'conversation_history',
      retentionPeriodDays: 1095, // 3 years
      legalBasis: 'Consent and legitimate interest',
      description: 'WhatsApp and web chat conversations',
      autoDelete: true
    },
    {
      dataType: 'booking_history',
      retentionPeriodDays: 2555, // 7 years (tax/accounting requirements)
      legalBasis: 'Legal obligation',
      description: 'Appointment and service history for accounting',
      autoDelete: false
    },
    {
      dataType: 'consent_records',
      retentionPeriodDays: 2555, // 7 years
      legalBasis: 'Legal obligation',
      description: 'GDPR consent records for compliance',
      autoDelete: false
    },
    {
      dataType: 'security_logs',
      retentionPeriodDays: 365, // 1 year
      legalBasis: 'Legitimate interest',
      description: 'Security audit logs for system protection',
      autoDelete: true
    },
    {
      dataType: 'marketing_data',
      retentionPeriodDays: 1095, // 3 years
      legalBasis: 'Consent',
      description: 'Marketing preferences and communication history',
      autoDelete: true
    }
  ];

  /**
   * Get retention policies
   */
  static getRetentionPolicies(): RetentionPolicy[] {
    return this.RETENTION_POLICIES;
  }

  /**
   * Check if data should be deleted based on retention policy
   */
  static shouldDeleteData(dataType: string, createdAt: Date): boolean {
    const policy = this.RETENTION_POLICIES.find(p => p.dataType === dataType);
    if (!policy) return false;

    const retentionEndDate = new Date(createdAt);
    retentionEndDate.setDate(retentionEndDate.getDate() + policy.retentionPeriodDays);

    return new Date() > retentionEndDate;
  }

  /**
   * Process data retention - delete expired data
   */
  static async processDataRetention(): Promise<{
    conversationsDeleted: number;
    securityLogsDeleted: number;
    marketingDataDeleted: number;
  }> {
    try {
      const results = {
        conversationsDeleted: 0,
        securityLogsDeleted: 0,
        marketingDataDeleted: 0
      };

      // Delete expired conversations (only if consent was revoked or expired)
      const conversationCutoff = new Date();
      conversationCutoff.setDate(conversationCutoff.getDate() - 1095); // 3 years

      const expiredConversations = await db('conversations')
        .where('created_at', '<', conversationCutoff)
        .select('id', 'client_id');

      for (const conversation of expiredConversations) {
        const hasConsent = await ConsentService.hasConsent(
          conversation.client_id, 
          'WHATSAPP_COMMUNICATION'
        );

        if (!hasConsent) {
          // Delete messages first (foreign key constraint)
          await db('messages').where('conversation_id', conversation.id).del();
          // Delete conversation
          await db('conversations').where('id', conversation.id).del();
          results.conversationsDeleted++;
        }
      }

      // Delete expired security logs
      const securityLogCutoff = new Date();
      securityLogCutoff.setDate(securityLogCutoff.getDate() - 365); // 1 year

      // Note: Security logs are in Redis, this would need to be implemented
      // in the SecurityAuditService for Redis cleanup

      // Delete expired marketing data (if consent revoked)
      const marketingCutoff = new Date();
      marketingCutoff.setDate(marketingCutoff.getDate() - 1095); // 3 years

      const clientsWithRevokedMarketingConsent = await db('consent_records')
        .where('consent_type', 'MARKETING')
        .where('granted', false)
        .select('client_id');

      for (const client of clientsWithRevokedMarketingConsent) {
        // Delete marketing-related data
        const deleted = await db('scheduled_notifications')
          .where('client_id', client.client_id)
          .where('type', 'promotion')
          .del();
        
        results.marketingDataDeleted += deleted;
      }

      logger.info('Data retention processing completed', results);
      return results;

    } catch (error) {
      logger.error('Error processing data retention:', error);
      throw new Error('Failed to process data retention');
    }
  }

  /**
   * Export all data for a client (GDPR Article 20 - Right to data portability)
   */
  static async exportClientData(clientId: string, requestedBy: string): Promise<DataExportRequest> {
    try {
      const exportRequest: DataExportRequest = {
        clientId,
        requestedBy,
        requestDate: new Date(),
        status: 'PROCESSING'
      };

      // Insert export request record
      const [requestId] = await db('data_export_requests').insert(exportRequest);

      try {
        // Gather all client data
        const clientData = await this.gatherClientData(clientId);

        // Update export request with data
        await db('data_export_requests')
          .where('id', requestId)
          .update({
            status: 'COMPLETED',
            exportData: JSON.stringify(clientData),
            completedAt: new Date()
          });

        exportRequest.status = 'COMPLETED';
        exportRequest.exportData = clientData;
        exportRequest.completedAt = new Date();

        logger.info('Client data export completed', { clientId, requestedBy });
        return exportRequest;

      } catch (error) {
        // Update export request as failed
        await db('data_export_requests')
          .where('id', requestId)
          .update({ status: 'FAILED' });

        throw error;
      }

    } catch (error) {
      logger.error('Error exporting client data:', error);
      throw new Error('Failed to export client data');
    }
  }

  /**
   * Gather all data for a client
   */
  private static async gatherClientData(clientId: string): Promise<any> {
    try {
      // Client basic information
      const client = await db('clients').where('id', clientId).first();
      
      // Booking history
      const bookings = await db('bookings')
        .where('client_id', clientId)
        .leftJoin('services', 'bookings.service_id', 'services.id')
        .select(
          'bookings.*',
          'services.name as service_name',
          'services.category as service_category'
        );

      // Conversation history
      const conversations = await db('conversations')
        .where('client_id', clientId)
        .select();

      const messages = await db('messages')
        .whereIn('conversation_id', conversations.map(c => c.id))
        .select();

      // Consent records
      const consents = await ConsentService.getClientConsents(clientId);

      // Loyalty points history
      const loyaltyHistory = await db('loyalty_transactions')
        .where('client_id', clientId)
        .select();

      // Scheduled notifications
      const notifications = await db('scheduled_notifications')
        .where('client_id', clientId)
        .select();

      return {
        exportDate: new Date().toISOString(),
        clientId,
        personalData: {
          ...client,
          // Decrypt sensitive fields for export
          phone: client.phone, // Already decrypted in model
          email: client.email
        },
        bookingHistory: bookings,
        conversationHistory: {
          conversations,
          messages: messages.map(msg => ({
            ...msg,
            content: msg.content // Keep original content for export
          }))
        },
        consentRecords: consents,
        loyaltyHistory,
        scheduledNotifications: notifications,
        dataRetentionInfo: {
          policies: this.RETENTION_POLICIES,
          exportNote: 'This export contains all personal data we hold about you as of the export date.'
        }
      };

    } catch (error) {
      logger.error('Error gathering client data:', error);
      throw new Error('Failed to gather client data');
    }
  }

  /**
   * Delete all data for a client (Right to be forgotten - GDPR Article 17)
   */
  static async deleteClientData(
    clientId: string, 
    requestedBy: string,
    reason: string
  ): Promise<{
    success: boolean;
    deletedRecords: Record<string, number>;
    retainedRecords: Record<string, number>;
    retentionReasons: Record<string, string>;
  }> {
    try {
      const deletedRecords: Record<string, number> = {};
      const retainedRecords: Record<string, number> = {};
      const retentionReasons: Record<string, string> = {};

      // Check if we can legally delete all data
      const bookingCount = await db('bookings')
        .where('client_id', clientId)
        .count('id as count')
        .first();

      // Retain booking data for legal/tax obligations (7 years)
      const recentBookings = await db('bookings')
        .where('client_id', clientId)
        .where('created_at', '>', new Date(Date.now() - 7 * 365 * 24 * 60 * 60 * 1000))
        .count('id as count')
        .first();

      if (recentBookings && Number(recentBookings.count) > 0) {
        retainedRecords.bookings = Number(recentBookings.count);
        retentionReasons.bookings = 'Legal obligation - tax and accounting records (7 years retention)';
      }

      // Delete conversations and messages
      const conversations = await db('conversations')
        .where('client_id', clientId)
        .select('id');

      let messagesDeleted = 0;
      for (const conversation of conversations) {
        const deleted = await db('messages')
          .where('conversation_id', conversation.id)
          .del();
        messagesDeleted += deleted;
      }

      const conversationsDeleted = await db('conversations')
        .where('client_id', clientId)
        .del();

      deletedRecords.messages = messagesDeleted;
      deletedRecords.conversations = conversationsDeleted;

      // Delete scheduled notifications
      deletedRecords.scheduledNotifications = await db('scheduled_notifications')
        .where('client_id', clientId)
        .del();

      // Delete loyalty transactions (unless recent for accounting)
      const oldLoyaltyTransactions = await db('loyalty_transactions')
        .where('client_id', clientId)
        .where('created_at', '<', new Date(Date.now() - 7 * 365 * 24 * 60 * 60 * 1000))
        .del();

      deletedRecords.loyaltyTransactions = oldLoyaltyTransactions;

      // Anonymize client record instead of deleting (to preserve referential integrity)
      await db('clients')
        .where('id', clientId)
        .update({
          name: 'DELETED_USER',
          phone: 'DELETED',
          email: null,
          allergies: null,
          preferences: null,
          updated_at: new Date()
        });

      deletedRecords.clientPersonalData = 1;

      // Keep consent records for legal compliance
      const consentCount = await db('consent_records')
        .where('client_id', clientId)
        .count('id as count')
        .first();

      if (consentCount && Number(consentCount.count) > 0) {
        retainedRecords.consentRecords = Number(consentCount.count);
        retentionReasons.consentRecords = 'Legal obligation - GDPR compliance records (7 years retention)';
      }

      // Log the deletion request
      await db('data_deletion_requests').insert({
        id: `deletion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        clientId,
        requestedBy,
        reason,
        deletedRecords: JSON.stringify(deletedRecords),
        retainedRecords: JSON.stringify(retainedRecords),
        retentionReasons: JSON.stringify(retentionReasons),
        processedAt: new Date(),
        createdAt: new Date()
      });

      logger.info('Client data deletion completed', {
        clientId,
        requestedBy,
        deletedRecords,
        retainedRecords
      });

      return {
        success: true,
        deletedRecords,
        retainedRecords,
        retentionReasons
      };

    } catch (error) {
      logger.error('Error deleting client data:', error);
      throw new Error('Failed to delete client data');
    }
  }

  /**
   * Get data export requests
   */
  static async getDataExportRequests(limit: number = 50): Promise<DataExportRequest[]> {
    try {
      return await db('data_export_requests')
        .orderBy('requestDate', 'desc')
        .limit(limit)
        .select();
    } catch (error) {
      logger.error('Error getting data export requests:', error);
      throw new Error('Failed to get data export requests');
    }
  }

  /**
   * Get data deletion requests
   */
  static async getDataDeletionRequests(limit: number = 50): Promise<any[]> {
    try {
      return await db('data_deletion_requests')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .select();
    } catch (error) {
      logger.error('Error getting data deletion requests:', error);
      throw new Error('Failed to get data deletion requests');
    }
  }
}
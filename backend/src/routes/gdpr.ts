import { Router } from 'express';
import { GDPRController } from '../controllers/GDPRController';
import { authenticateToken, requireAdmin, requireManagerOrAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import Joi from 'joi';

const router = Router();

// Validation schemas
const recordConsentSchema = Joi.object({
  clientId: Joi.string().uuid().required(),
  consentType: Joi.string().valid(
    'WHATSAPP_COMMUNICATION',
    'DATA_PROCESSING',
    'MARKETING',
    'ANALYTICS'
  ).required(),
  granted: Joi.boolean().required(),
  source: Joi.string().valid('WEB', 'WHATSAPP', 'ADMIN').required(),
  legalBasis: Joi.string().valid(
    'CONSENT',
    'CONTRACT',
    'LEGITIMATE_INTEREST',
    'LEGAL_OBLIGATION'
  ).required(),
  purpose: Joi.string().max(500).required(),
  dataCategories: Joi.array().items(Joi.string()).required(),
  retentionPeriod: Joi.number().integer().min(1).required()
});

const revokeConsentSchema = Joi.object({
  clientId: Joi.string().uuid().required(),
  consentType: Joi.string().valid(
    'WHATSAPP_COMMUNICATION',
    'DATA_PROCESSING',
    'MARKETING',
    'ANALYTICS'
  ).required()
});

const dataExportSchema = Joi.object({
  clientId: Joi.string().uuid().required()
});

const dataDeletionSchema = Joi.object({
  clientId: Joi.string().uuid().required(),
  reason: Joi.string().max(1000).required()
});

const whatsappConsentRequestSchema = Joi.object({
  clientId: Joi.string().uuid().required(),
  phoneNumber: Joi.string().required()
});

const whatsappConsentResponseSchema = Joi.object({
  consentToken: Joi.string().required(),
  granted: Joi.boolean().required()
});

// Public endpoints (no authentication required)
/**
 * @route POST /api/v1/gdpr/whatsapp-consent/response
 * @desc Process WhatsApp consent response from client
 * @access Public
 */
router.post('/whatsapp-consent/response', 
  validateRequest(whatsappConsentResponseSchema), 
  GDPRController.processWhatsAppConsentResponse
);

/**
 * @route GET /api/v1/gdpr/retention-policies
 * @desc Get data retention policies (public information)
 * @access Public
 */
router.get('/retention-policies', GDPRController.getRetentionPolicies);

// Protected endpoints (require authentication)
router.use(authenticateToken);

/**
 * @route POST /api/v1/gdpr/consent
 * @desc Record consent decision
 * @access Private (Any authenticated user)
 */
router.post('/consent', 
  validateRequest(recordConsentSchema), 
  GDPRController.recordConsent
);

/**
 * @route GET /api/v1/gdpr/consent/:clientId
 * @desc Get client consent status and history
 * @access Private (Any authenticated user)
 */
router.get('/consent/:clientId', GDPRController.getConsentStatus);

/**
 * @route POST /api/v1/gdpr/consent/revoke
 * @desc Revoke consent for specific type
 * @access Private (Any authenticated user)
 */
router.post('/consent/revoke', 
  validateRequest(revokeConsentSchema), 
  GDPRController.revokeConsent
);

/**
 * @route POST /api/v1/gdpr/data-export
 * @desc Request data export for client (Right to data portability)
 * @access Private (Manager/Admin)
 */
router.post('/data-export', 
  requireManagerOrAdmin,
  validateRequest(dataExportSchema), 
  GDPRController.requestDataExport
);

/**
 * @route POST /api/v1/gdpr/data-deletion
 * @desc Request data deletion for client (Right to be forgotten)
 * @access Private (Admin only)
 */
router.post('/data-deletion', 
  requireAdmin,
  validateRequest(dataDeletionSchema), 
  GDPRController.requestDataDeletion
);

/**
 * @route GET /api/v1/gdpr/export-requests
 * @desc Get data export requests history
 * @access Private (Manager/Admin)
 */
router.get('/export-requests', 
  requireManagerOrAdmin,
  GDPRController.getDataExportRequests
);

/**
 * @route GET /api/v1/gdpr/deletion-requests
 * @desc Get data deletion requests history
 * @access Private (Admin only)
 */
router.get('/deletion-requests', 
  requireAdmin,
  GDPRController.getDataDeletionRequests
);

/**
 * @route POST /api/v1/gdpr/whatsapp-consent/request
 * @desc Request WhatsApp consent from client
 * @access Private (Any authenticated user)
 */
router.post('/whatsapp-consent/request', 
  validateRequest(whatsappConsentRequestSchema), 
  GDPRController.requestWhatsAppConsent
);

/**
 * @route POST /api/v1/gdpr/retention/process
 * @desc Process data retention (cleanup expired data)
 * @access Private (Admin only)
 */
router.post('/retention/process', 
  requireAdmin,
  GDPRController.processDataRetention
);

/**
 * @route POST /api/v1/gdpr/cleanup/expired-consents
 * @desc Cleanup expired consent requests
 * @access Private (Admin only)
 */
router.post('/cleanup/expired-consents', 
  requireAdmin,
  GDPRController.cleanupExpiredConsents
);

export default router;
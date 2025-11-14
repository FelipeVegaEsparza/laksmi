import { Router, Request, Response } from 'express';
import { EmailService } from '../services/EmailService';
import { CompanySettingsModel } from '../models/CompanySettings';
import logger from '../utils/logger';
import Joi from 'joi';

const router = Router();

// Esquema de validación para el formulario de contacto
const contactSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'string.max': 'El nombre no puede tener más de 100 caracteres',
    'any.required': 'El nombre es requerido'
  }),
  phone: Joi.string().min(8).max(20).required().messages({
    'string.min': 'El teléfono debe tener al menos 8 caracteres',
    'string.max': 'El teléfono no puede tener más de 20 caracteres',
    'any.required': 'El teléfono es requerido'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Debe ser un email válido',
    'any.required': 'El email es requerido'
  }),
  subject: Joi.string().max(200).optional().allow('').messages({
    'string.max': 'El asunto no puede tener más de 200 caracteres'
  }),
  message: Joi.string().min(10).max(1000).required().messages({
    'string.min': 'El mensaje debe tener al menos 10 caracteres',
    'string.max': 'El mensaje no puede tener más de 1000 caracteres',
    'any.required': 'El mensaje es requerido'
  }),
  privacy: Joi.boolean().valid(true).required().messages({
    'any.only': 'Debes aceptar la política de privacidad',
    'any.required': 'Debes aceptar la política de privacidad'
  })
});

/**
 * POST /api/v1/contact
 * Enviar mensaje de contacto
 * @access Public
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validar datos
    const { error, value } = contactSchema.validate(req.body);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      res.status(400).json({
        success: false,
        error: errorMessage
      });
      return;
    }

    const { name, phone, email, subject, message } = value;

    // Obtener configuración de la empresa para el email de destino
    const companySettings = await CompanySettingsModel.getSettings();
    
    if (!companySettings?.contactEmail) {
      logger.error('No contact email configured in company settings');
      res.status(500).json({
        success: false,
        error: 'No se ha configurado un email de contacto'
      });
      return;
    }

    // Enviar email a la empresa
    const emailSent = await EmailService.sendContactEmail(companySettings.contactEmail, {
      name,
      phone,
      email,
      subject: subject || 'Sin asunto',
      message
    });

    if (emailSent) {
      logger.info(`Contact form submitted by ${email}`);
      res.json({
        success: true,
        message: 'Mensaje enviado correctamente'
      });
    } else {
      logger.error('Failed to send contact email');
      res.status(500).json({
        success: false,
        error: 'Error al enviar el mensaje. Por favor, intenta nuevamente.'
      });
    }
  } catch (error: any) {
    logger.error('Error processing contact form:', error);
    res.status(500).json({
      success: false,
      error: 'Error al procesar el mensaje'
    });
  }
});

export default router;

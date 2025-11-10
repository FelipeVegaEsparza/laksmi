import Joi from 'joi';

// Validación para enviar mensaje
export const sendMessageSchema = Joi.object({
  to: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'El número de teléfono debe tener formato internacional válido',
      'any.required': 'El número de teléfono es requerido'
    }),
  message: Joi.string()
    .min(1)
    .max(1600) // Límite de WhatsApp
    .required()
    .messages({
      'string.min': 'El mensaje no puede estar vacío',
      'string.max': 'El mensaje no puede tener más de 1600 caracteres',
      'any.required': 'El mensaje es requerido'
    }),
  mediaUrl: Joi.string()
    .uri()
    .optional()
    .messages({
      'string.uri': 'La URL del archivo debe ser válida'
    })
});

// Validación para enviar plantilla
export const sendTemplateSchema = Joi.object({
  to: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'El número de teléfono debe tener formato internacional válido',
      'any.required': 'El número de teléfono es requerido'
    }),
  templateName: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'El nombre de la plantilla no puede estar vacío',
      'string.max': 'El nombre de la plantilla no puede tener más de 100 caracteres',
      'any.required': 'El nombre de la plantilla es requerido'
    }),
  templateData: Joi.object()
    .pattern(Joi.string(), Joi.string().max(200))
    .optional()
    .messages({
      'object.base': 'Los datos de la plantilla deben ser un objeto',
      'string.max': 'Cada valor de la plantilla no puede tener más de 200 caracteres'
    })
});

// Validación para actualizar configuración de Twilio
export const updateTwilioConfigSchema = Joi.object({
  accountSid: Joi.string()
    .pattern(/^AC[a-f0-9]{32}$/)
    .optional()
    .messages({
      'string.pattern.base': 'El Account SID debe tener formato válido de Twilio (AC seguido de 32 caracteres hexadecimales)'
    }),
  authToken: Joi.string()
    .min(32)
    .max(32)
    .optional()
    .messages({
      'string.min': 'El Auth Token debe tener 32 caracteres',
      'string.max': 'El Auth Token debe tener 32 caracteres'
    }),
  phoneNumber: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional()
    .messages({
      'string.pattern.base': 'El número de teléfono debe tener formato internacional válido'
    }),
  webhookUrl: Joi.string()
    .uri()
    .optional()
    .messages({
      'string.uri': 'La URL del webhook debe ser válida'
    }),
  validateSignatures: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'La validación de signatures debe ser verdadero o falso'
    })
});

// Validación para webhook de Twilio (usado internamente)
export const twilioWebhookSchema = Joi.object({
  MessageSid: Joi.string().required(),
  From: Joi.string().required(),
  To: Joi.string().required(),
  Body: Joi.string().allow('').optional(),
  MediaUrl0: Joi.string().uri().optional(),
  MediaContentType0: Joi.string().optional(),
  NumMedia: Joi.string().optional(),
  ProfileName: Joi.string().optional(),
  WaId: Joi.string().optional(),
  SmsStatus: Joi.string().optional(),
  AccountSid: Joi.string().required(),
  ApiVersion: Joi.string().optional()
}).unknown(true); // Permitir campos adicionales que Twilio pueda enviar

// Validación para parámetros de mensaje SID
export const messageSidSchema = Joi.object({
  messageSid: Joi.string()
    .pattern(/^[A-Z]{2}[a-f0-9]{32}$/)
    .required()
    .messages({
      'string.pattern.base': 'El Message SID debe tener formato válido de Twilio',
      'any.required': 'El Message SID es requerido'
    })
});

// Validación para filtros de estadísticas
export const statsFiltersSchema = Joi.object({
  dateFrom: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'La fecha debe estar en formato ISO'
    }),
  dateTo: Joi.date()
    .iso()
    .min(Joi.ref('dateFrom'))
    .optional()
    .messages({
      'date.format': 'La fecha debe estar en formato ISO',
      'date.min': 'La fecha final debe ser posterior a la fecha inicial'
    }),
  phoneNumber: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional()
    .messages({
      'string.pattern.base': 'El número de teléfono debe tener formato internacional válido'
    })
});

// Validación para configuración de rate limiting
export const rateLimitConfigSchema = Joi.object({
  messagesPerMinute: Joi.number()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'number.min': 'El límite debe ser al menos 1 mensaje por minuto',
      'number.max': 'El límite no puede ser más de 100 mensajes por minuto'
    }),
  messagesPerHour: Joi.number()
    .min(10)
    .max(1000)
    .optional()
    .messages({
      'number.min': 'El límite debe ser al menos 10 mensajes por hora',
      'number.max': 'El límite no puede ser más de 1000 mensajes por hora'
    }),
  messagesPerDay: Joi.number()
    .min(100)
    .max(10000)
    .optional()
    .messages({
      'number.min': 'El límite debe ser al menos 100 mensajes por día',
      'number.max': 'El límite no puede ser más de 10000 mensajes por día'
    })
});

// Validación para configuración de reintentos
export const retryConfigSchema = Joi.object({
  maxRetries: Joi.number()
    .min(0)
    .max(5)
    .optional()
    .messages({
      'number.min': 'El número de reintentos no puede ser negativo',
      'number.max': 'El número máximo de reintentos es 5'
    }),
  retryDelay: Joi.number()
    .min(100)
    .max(10000)
    .optional()
    .messages({
      'number.min': 'El retraso debe ser al menos 100ms',
      'number.max': 'El retraso no puede ser más de 10 segundos'
    }),
  backoffMultiplier: Joi.number()
    .min(1)
    .max(3)
    .optional()
    .messages({
      'number.min': 'El multiplicador debe ser al menos 1',
      'number.max': 'El multiplicador no puede ser más de 3'
    })
});

// ========== VALIDACIONES PARA PLANTILLAS WHATSAPP ==========

// Validación para previsualizar plantilla
export const previewTemplateSchema = Joi.object({
  templateData: Joi.object()
    .pattern(Joi.string(), Joi.string().max(500))
    .required()
    .messages({
      'object.base': 'Los datos de la plantilla deben ser un objeto',
      'string.max': 'Cada valor de la plantilla no puede tener más de 500 caracteres',
      'any.required': 'Los datos de la plantilla son requeridos'
    })
});

// Validación para programar plantilla
export const scheduleTemplateSchema = Joi.object({
  templateName: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'El nombre de la plantilla no puede estar vacío',
      'string.max': 'El nombre de la plantilla no puede tener más de 100 caracteres',
      'any.required': 'El nombre de la plantilla es requerido'
    }),
  clientId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'El ID del cliente debe ser un UUID válido',
      'any.required': 'El ID del cliente es requerido'
    }),
  scheduledFor: Joi.date()
    .iso()
    .min('now')
    .required()
    .messages({
      'date.format': 'La fecha debe estar en formato ISO',
      'date.min': 'La fecha programada debe ser en el futuro',
      'any.required': 'La fecha programada es requerida'
    }),
  templateData: Joi.object()
    .pattern(Joi.string(), Joi.string().max(500))
    .required()
    .messages({
      'object.base': 'Los datos de la plantilla deben ser un objeto',
      'string.max': 'Cada valor de la plantilla no puede tener más de 500 caracteres',
      'any.required': 'Los datos de la plantilla son requeridos'
    }),
  bookingId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'El ID de la cita debe ser un UUID válido'
    })
});

// Validación para enviar recordatorio de cita
export const sendAppointmentReminderSchema = Joi.object({
  clientId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'El ID del cliente debe ser un UUID válido',
      'any.required': 'El ID del cliente es requerido'
    }),
  bookingId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'El ID de la cita debe ser un UUID válido',
      'any.required': 'El ID de la cita es requerido'
    })
});

// Validación para enviar confirmación de reserva
export const sendBookingConfirmationSchema = Joi.object({
  clientId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'El ID del cliente debe ser un UUID válido',
      'any.required': 'El ID del cliente es requerido'
    }),
  bookingId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'El ID de la cita debe ser un UUID válido',
      'any.required': 'El ID de la cita es requerido'
    })
});

// Validación para enviar seguimiento
export const sendFollowUpSchema = Joi.object({
  clientId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'El ID del cliente debe ser un UUID válido',
      'any.required': 'El ID del cliente es requerido'
    }),
  serviceId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'El ID del servicio debe ser un UUID válido',
      'any.required': 'El ID del servicio es requerido'
    }),
  customMessage: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'El mensaje personalizado no puede tener más de 500 caracteres'
    })
});

// Validación para filtros de plantillas programadas
export const scheduledTemplatesFiltersSchema = Joi.object({
  clientId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'El ID del cliente debe ser un UUID válido'
    }),
  bookingId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'El ID de la cita debe ser un UUID válido'
    }),
  templateName: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'El nombre de la plantilla no puede tener más de 100 caracteres'
    }),
  status: Joi.string()
    .valid('pending', 'sent', 'failed', 'cancelled')
    .optional()
    .messages({
      'any.only': 'El estado debe ser: pending, sent, failed o cancelled'
    }),
  scheduledFrom: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'La fecha debe estar en formato ISO'
    }),
  scheduledTo: Joi.date()
    .iso()
    .min(Joi.ref('scheduledFrom'))
    .optional()
    .messages({
      'date.format': 'La fecha debe estar en formato ISO',
      'date.min': 'La fecha final debe ser posterior a la fecha inicial'
    }),
  page: Joi.number()
    .min(1)
    .optional()
    .messages({
      'number.min': 'La página debe ser al menos 1'
    }),
  limit: Joi.number()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'number.min': 'El límite debe ser al menos 1',
      'number.max': 'El límite no puede ser más de 100'
    })
});
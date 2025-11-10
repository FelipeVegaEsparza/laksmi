import Joi from 'joi';

// Validación para procesar mensaje
export const processMessageSchema = Joi.object({
  content: Joi.string()
    .min(1)
    .max(4000)
    .required()
    .messages({
      'string.min': 'El contenido del mensaje es requerido',
      'string.max': 'El mensaje no puede tener más de 4000 caracteres',
      'any.required': 'El contenido del mensaje es requerido'
    }),
  clientId: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.min': 'El ID del cliente es requerido',
      'any.required': 'El ID del cliente es requerido'
    }),
  channel: Joi.string()
    .valid('web', 'whatsapp')
    .required()
    .messages({
      'any.only': 'El canal debe ser web o whatsapp',
      'any.required': 'El canal es requerido'
    }),
  mediaUrl: Joi.string()
    .uri()
    .optional()
    .messages({
      'string.uri': 'La URL del media debe ser válida'
    }),
  metadata: Joi.object()
    .pattern(Joi.string(), Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean()))
    .optional()
    .messages({
      'object.base': 'Los metadatos deben ser un objeto'
    })
});

// Validación para analizar mensaje
export const analyzeMessageSchema = Joi.object({
  message: Joi.string()
    .min(1)
    .max(4000)
    .required()
    .messages({
      'string.min': 'El mensaje es requerido',
      'string.max': 'El mensaje no puede tener más de 4000 caracteres',
      'any.required': 'El mensaje es requerido'
    }),
  conversationId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'El ID de conversación debe ser un UUID válido'
    })
});

// Validación para entrenar NLU
export const trainNLUSchema = Joi.object({
  message: Joi.string()
    .min(1)
    .max(1000)
    .required()
    .messages({
      'string.min': 'El mensaje es requerido',
      'string.max': 'El mensaje no puede tener más de 1000 caracteres',
      'any.required': 'El mensaje es requerido'
    }),
  expectedIntent: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'La intención esperada es requerida',
      'string.max': 'La intención no puede tener más de 100 caracteres',
      'any.required': 'La intención esperada es requerida'
    }),
  expectedEntities: Joi.array()
    .items(Joi.object({
      type: Joi.string()
        .valid(
          'service_name',
          'date',
          'time',
          'professional_name',
          'client_name',
          'phone_number',
          'email',
          'price',
          'duration',
          'location'
        )
        .required(),
      value: Joi.string().required(),
      confidence: Joi.number().min(0).max(1).optional(),
      start: Joi.number().min(0).optional(),
      end: Joi.number().min(0).optional()
    }))
    .optional()
    .messages({
      'array.base': 'Las entidades esperadas deben ser un array'
    })
});

// Validación para escalación de conversación
export const escalateConversationSchema = Joi.object({
  reason: Joi.string()
    .min(1)
    .max(500)
    .optional()
    .messages({
      'string.max': 'La razón no puede tener más de 500 caracteres'
    }),
  humanAgentId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'El ID del agente humano debe ser un UUID válido'
    })
});

// Validación para actualizar contexto
export const updateContextSchema = Joi.object({
  currentIntent: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'La intención actual no puede tener más de 100 caracteres'
    }),
  currentFlow: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'El flujo actual no puede tener más de 100 caracteres'
    }),
  flowStep: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'El paso del flujo debe ser mayor o igual a 0'
    }),
  pendingBooking: Joi.object({
    serviceId: Joi.string().uuid().optional(),
    serviceName: Joi.string().max(255).optional(),
    preferredDate: Joi.string().max(50).optional(),
    preferredTime: Joi.string().max(20).optional(),
    preferredProfessionalId: Joi.string().uuid().optional(),
    notes: Joi.string().max(500).optional(),
    step: Joi.string()
      .valid('service_selection', 'date_selection', 'time_selection', 'confirmation', 'completed')
      .optional()
  }).optional(),
  userPreferences: Joi.object({
    preferredLanguage: Joi.string().max(10).optional(),
    preferredChannel: Joi.string().valid('web', 'whatsapp').optional(),
    communicationStyle: Joi.string().valid('formal', 'casual').optional(),
    timezone: Joi.string().max(50).optional()
  }).optional(),
  variables: Joi.object()
    .pattern(Joi.string(), Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean()))
    .optional(),
  escalationReason: Joi.string()
    .max(500)
    .optional(),
  humanAgentId: Joi.string()
    .uuid()
    .optional()
});

// Validación para configuración de componentes
export const updateConfigSchema = Joi.object({
  component: Joi.string()
    .valid('messageRouter', 'contextManager', 'nlu', 'dialogManager')
    .required()
    .messages({
      'any.only': 'El componente debe ser: messageRouter, contextManager, nlu o dialogManager',
      'any.required': 'El componente es requerido'
    }),
  config: Joi.object()
    .required()
    .messages({
      'object.base': 'La configuración debe ser un objeto',
      'any.required': 'La configuración es requerida'
    })
});

// Validación para limpieza de conversaciones
export const cleanupConversationsSchema = Joi.object({
  hoursInactive: Joi.number()
    .min(1)
    .max(168) // Máximo 7 días
    .optional()
    .default(24)
    .messages({
      'number.min': 'Las horas de inactividad deben ser al menos 1',
      'number.max': 'Las horas de inactividad no pueden ser más de 168 (7 días)'
    })
});

// Validación para filtros de conversaciones
export const conversationFiltersSchema = Joi.object({
  clientId: Joi.string().uuid().optional(),
  channel: Joi.string().valid('web', 'whatsapp').optional(),
  status: Joi.string().valid('active', 'closed', 'escalated', 'waiting').optional(),
  limit: Joi.number().min(1).max(100).optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().min(Joi.ref('dateFrom')).optional()
}).messages({
  'string.uuid': 'Los IDs deben ser UUIDs válidos',
  'date.iso': 'Las fechas deben estar en formato ISO',
  'date.min': 'La fecha final debe ser posterior a la fecha inicial',
  'any.only': 'Valor no válido para el campo',
  'number.min': 'Los números deben ser positivos',
  'number.max': 'El límite máximo es 100'
});

// Validación para webhook de Twilio (más flexible)
export const twilioWebhookSchema = Joi.object({
  MessageSid: Joi.string().optional(),
  From: Joi.string().optional(),
  To: Joi.string().optional(),
  Body: Joi.string().allow('').optional(),
  MediaUrl0: Joi.string().uri().optional(),
  MediaContentType0: Joi.string().optional(),
  NumMedia: Joi.string().optional()
}).unknown(true); // Permitir campos adicionales de Twilio
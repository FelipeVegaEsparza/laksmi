import Joi from 'joi';

// Validación para escalar conversación
export const escalateConversationSchema = Joi.object({
  reason: Joi.string()
    .valid(
      'low_confidence',
      'failed_attempts', 
      'complaint',
      'complex_request',
      'technical_issue',
      'payment_issue',
      'client_request'
    )
    .required()
    .messages({
      'any.only': 'La razón debe ser una de las opciones válidas',
      'any.required': 'La razón de escalación es requerida'
    }),
  priority: Joi.string()
    .valid('low', 'medium', 'high', 'urgent')
    .optional()
    .default('medium')
    .messages({
      'any.only': 'La prioridad debe ser: low, medium, high o urgent'
    }),
  summary: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'El resumen no puede tener más de 500 caracteres'
    }),
  humanAgentId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'El ID del agente humano debe ser un UUID válido'
    })
});

// Validación para asignar agente
export const assignAgentSchema = Joi.object({
  humanAgentId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'El ID del agente humano debe ser un UUID válido',
      'any.required': 'El ID del agente humano es requerido'
    })
});

// Validación para resolver escalación
export const resolveEscalationSchema = Joi.object({
  resolution: Joi.string()
    .min(10)
    .max(1000)
    .required()
    .messages({
      'string.min': 'La resolución debe tener al menos 10 caracteres',
      'string.max': 'La resolución no puede tener más de 1000 caracteres',
      'any.required': 'La descripción de la resolución es requerida'
    })
});

// Validación para filtros de escalación
export const escalationFiltersSchema = Joi.object({
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
  reason: Joi.string().valid(
    'low_confidence',
    'failed_attempts', 
    'complaint',
    'complex_request',
    'technical_issue',
    'payment_issue',
    'client_request'
  ).optional(),
  status: Joi.string().valid('pending', 'assigned', 'resolved').optional(),
  humanAgentId: Joi.string().uuid().optional()
}).messages({
  'string.uuid': 'Los IDs deben ser UUIDs válidos',
  'any.only': 'Valor no válido para el campo'
});

// Validación para limpieza de escalaciones
export const cleanupEscalationsSchema = Joi.object({
  hoursOld: Joi.number()
    .min(1)
    .max(168) // Máximo 7 días
    .optional()
    .default(48)
    .messages({
      'number.min': 'Las horas deben ser al menos 1',
      'number.max': 'Las horas no pueden ser más de 168 (7 días)'
    })
});

// Validación para configuración de escalación
export const escalationConfigSchema = Joi.object({
  confidenceThreshold: Joi.number()
    .min(0)
    .max(1)
    .optional()
    .messages({
      'number.min': 'El umbral de confianza debe ser entre 0 y 1',
      'number.max': 'El umbral de confianza debe ser entre 0 y 1'
    }),
  maxFailedAttempts: Joi.number()
    .min(1)
    .max(10)
    .optional()
    .messages({
      'number.min': 'Los intentos fallidos deben ser al menos 1',
      'number.max': 'Los intentos fallidos no pueden ser más de 10'
    }),
  complexityKeywords: Joi.array()
    .items(Joi.string().max(50))
    .optional()
    .messages({
      'array.base': 'Las palabras clave deben ser un array',
      'string.max': 'Cada palabra clave no puede tener más de 50 caracteres'
    }),
  escalationReasons: Joi.object()
    .pattern(
      Joi.string().valid(
        'low_confidence',
        'failed_attempts', 
        'complaint',
        'complex_request',
        'technical_issue',
        'payment_issue',
        'client_request'
      ),
      Joi.object({
        priority: Joi.string().valid('low', 'medium', 'high', 'urgent').required(),
        autoEscalate: Joi.boolean().required()
      })
    )
    .optional()
    .messages({
      'object.base': 'Las razones de escalación deben ser un objeto'
    })
});
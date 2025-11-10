import Joi from 'joi';

// Validación para iniciar toma de control
export const startTakeoverSchema = Joi.object({
  escalationId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'El ID de escalación debe ser un UUID válido'
    })
});

// Validación para enviar mensaje
export const sendMessageSchema = Joi.object({
  content: Joi.string()
    .min(1)
    .max(4000)
    .required()
    .messages({
      'string.min': 'El mensaje no puede estar vacío',
      'string.max': 'El mensaje no puede tener más de 4000 caracteres',
      'any.required': 'El contenido del mensaje es requerido'
    }),
  mediaUrl: Joi.string()
    .uri()
    .optional()
    .messages({
      'string.uri': 'La URL del archivo debe ser válida'
    })
});

// Validación para finalizar control
export const endTakeoverSchema = Joi.object({
  resolution: Joi.string()
    .min(10)
    .max(1000)
    .optional()
    .messages({
      'string.min': 'La resolución debe tener al menos 10 caracteres',
      'string.max': 'La resolución no puede tener más de 1000 caracteres'
    })
});

// Validación para transferir control
export const transferControlSchema = Joi.object({
  toAgentId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'El ID del agente destino debe ser un UUID válido',
      'any.required': 'El ID del agente destino es requerido'
    }),
  reason: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'La razón no puede tener más de 500 caracteres'
    })
});

// Validación para limpieza de sesiones
export const cleanupSessionsSchema = Joi.object({
  hoursInactive: Joi.number()
    .min(1)
    .max(168) // Máximo 7 días
    .optional()
    .default(24)
    .messages({
      'number.min': 'Las horas deben ser al menos 1',
      'number.max': 'Las horas no pueden ser más de 168 (7 días)'
    })
});
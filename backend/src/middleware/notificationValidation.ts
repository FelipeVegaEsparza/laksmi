import Joi from 'joi';

// Validación para crear notificación
export const createNotificationSchema = Joi.object({
  clientId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'El ID del cliente debe ser un UUID válido',
      'any.required': 'El ID del cliente es requerido'
    }),
  bookingId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'El ID de la cita debe ser un UUID válido'
    }),
  type: Joi.string()
    .valid(
      'appointment_reminder',
      'appointment_confirmation', 
      'appointment_cancellation',
      'follow_up',
      'promotion',
      'birthday_greeting',
      'loyalty_reward'
    )
    .required()
    .messages({
      'any.only': 'El tipo debe ser uno de los valores permitidos',
      'any.required': 'El tipo de notificación es requerido'
    }),
  channel: Joi.string()
    .valid('whatsapp', 'email', 'sms')
    .required()
    .messages({
      'any.only': 'El canal debe ser: whatsapp, email o sms',
      'any.required': 'El canal es requerido'
    }),
  scheduledFor: Joi.date()
    .iso()
    .min('now')
    .required()
    .messages({
      'date.base': 'La fecha programada debe ser válida',
      'date.iso': 'La fecha debe estar en formato ISO',
      'date.min': 'La fecha programada no puede ser en el pasado',
      'any.required': 'La fecha programada es requerida'
    }),
  templateName: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'El nombre de la plantilla es requerido',
      'string.max': 'El nombre de la plantilla no puede tener más de 100 caracteres',
      'any.required': 'El nombre de la plantilla es requerido'
    }),
  templateData: Joi.object()
    .pattern(Joi.string(), Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean()))
    .required()
    .messages({
      'object.base': 'Los datos de la plantilla deben ser un objeto',
      'any.required': 'Los datos de la plantilla son requeridos'
    })
});

// Validación para actualizar notificación
export const updateNotificationSchema = Joi.object({
  scheduledFor: Joi.date()
    .iso()
    .min('now')
    .optional()
    .messages({
      'date.base': 'La fecha programada debe ser válida',
      'date.iso': 'La fecha debe estar en formato ISO',
      'date.min': 'La fecha programada no puede ser en el pasado'
    }),
  status: Joi.string()
    .valid('pending', 'sent', 'failed', 'cancelled')
    .optional()
    .messages({
      'any.only': 'El estado debe ser: pending, sent, failed o cancelled'
    }),
  templateData: Joi.object()
    .pattern(Joi.string(), Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean()))
    .optional()
    .messages({
      'object.base': 'Los datos de la plantilla deben ser un objeto'
    }),
  errorMessage: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'El mensaje de error no puede tener más de 500 caracteres'
    })
});

// Validación para filtros de búsqueda de notificaciones
export const notificationFiltersSchema = Joi.object({
  clientId: Joi.string().uuid().optional(),
  bookingId: Joi.string().uuid().optional(),
  type: Joi.string().valid(
    'appointment_reminder',
    'appointment_confirmation', 
    'appointment_cancellation',
    'follow_up',
    'promotion',
    'birthday_greeting',
    'loyalty_reward'
  ).optional(),
  channel: Joi.string().valid('whatsapp', 'email', 'sms').optional(),
  status: Joi.string().valid('pending', 'sent', 'failed', 'cancelled').optional(),
  scheduledFrom: Joi.date().iso().optional(),
  scheduledTo: Joi.date().iso().min(Joi.ref('scheduledFrom')).optional(),
  page: Joi.number().min(1).optional(),
  limit: Joi.number().min(1).max(100).optional()
}).messages({
  'string.uuid': 'Los IDs deben ser UUIDs válidos',
  'date.iso': 'Las fechas deben estar en formato ISO',
  'date.min': 'La fecha final debe ser posterior a la fecha inicial',
  'any.only': 'Valor no válido para el campo',
  'number.min': 'Los números deben ser positivos',
  'number.max': 'El límite máximo es 100'
});

// Validación para configuración de recordatorios
export const reminderConfigSchema = Joi.object({
  enabled: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'enabled debe ser verdadero o falso'
    }),
  hoursBeforeAppointment: Joi.number()
    .min(1)
    .max(168) // Máximo 7 días
    .optional()
    .messages({
      'number.min': 'Debe ser al menos 1 hora antes',
      'number.max': 'No puede ser más de 168 horas (7 días) antes'
    }),
  channels: Joi.array()
    .items(Joi.string().valid('whatsapp', 'email', 'sms'))
    .min(1)
    .optional()
    .messages({
      'array.min': 'Debe especificar al menos un canal',
      'any.only': 'Los canales deben ser: whatsapp, email o sms'
    }),
  templateName: Joi.string()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.min': 'El nombre de la plantilla es requerido',
      'string.max': 'El nombre de la plantilla no puede tener más de 100 caracteres'
    }),
  retryAttempts: Joi.number()
    .min(0)
    .max(5)
    .optional()
    .messages({
      'number.min': 'Los intentos de reenvío no pueden ser negativos',
      'number.max': 'Máximo 5 intentos de reenvío'
    }),
  retryIntervalMinutes: Joi.number()
    .min(5)
    .max(1440) // Máximo 24 horas
    .optional()
    .messages({
      'number.min': 'El intervalo mínimo es 5 minutos',
      'number.max': 'El intervalo máximo es 1440 minutos (24 horas)'
    })
});

// Validación para programar seguimiento
export const followUpSchema = Joi.object({
  hoursAfter: Joi.number()
    .min(1)
    .max(168) // Máximo 7 días después
    .optional()
    .default(24)
    .messages({
      'number.min': 'Debe ser al menos 1 hora después',
      'number.max': 'No puede ser más de 168 horas (7 días) después'
    })
});

// Validación para envío inmediato de notificación
export const sendNotificationSchema = Joi.object({
  clientId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'El ID del cliente debe ser un UUID válido',
      'any.required': 'El ID del cliente es requerido'
    }),
  channel: Joi.string()
    .valid('whatsapp', 'email', 'sms')
    .required()
    .messages({
      'any.only': 'El canal debe ser: whatsapp, email o sms',
      'any.required': 'El canal es requerido'
    }),
  templateName: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'El nombre de la plantilla es requerido',
      'string.max': 'El nombre de la plantilla no puede tener más de 100 caracteres',
      'any.required': 'El nombre de la plantilla es requerido'
    }),
  templateData: Joi.object()
    .pattern(Joi.string(), Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean()))
    .required()
    .messages({
      'object.base': 'Los datos de la plantilla deben ser un objeto',
      'any.required': 'Los datos de la plantilla son requeridos'
    }),
  scheduledFor: Joi.date()
    .iso()
    .min('now')
    .optional()
    .messages({
      'date.base': 'La fecha programada debe ser válida',
      'date.iso': 'La fecha debe estar en formato ISO',
      'date.min': 'La fecha programada no puede ser en el pasado'
    })
});
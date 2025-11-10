import Joi from 'joi';

// Validación para crear cita
export const createBookingSchema = Joi.object({
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
  dateTime: Joi.date()
    .iso()
    .min(new Date(Date.now() - 60000)) // Permitir hasta 1 minuto en el pasado
    .required()
    .messages({
      'date.base': 'La fecha y hora debe ser válida',
      'date.iso': 'La fecha debe estar en formato ISO',
      'date.min': 'La fecha debe ser actual o futura',
      'any.required': 'La fecha y hora son requeridas'
    }),
  preferredProfessionalId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'El ID del profesional debe ser un UUID válido'
    }),
  notes: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Las notas no pueden tener más de 500 caracteres'
    })
});

// Validación para actualizar cita
export const updateBookingSchema = Joi.object({
  dateTime: Joi.date()
    .iso()
    .min('now')
    .optional()
    .messages({
      'date.base': 'La fecha y hora debe ser válida',
      'date.iso': 'La fecha debe estar en formato ISO',
      'date.min': 'La fecha no puede ser en el pasado'
    }),
  professionalId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'El ID del profesional debe ser un UUID válido'
    }),
  status: Joi.string()
    .valid('confirmed', 'cancelled', 'completed', 'no_show')
    .optional()
    .messages({
      'any.only': 'El estado debe ser: confirmed, cancelled, completed o no_show'
    }),
  notes: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Las notas no pueden tener más de 500 caracteres'
    })
});

// Validación para horario de trabajo
const timeSlotSchema = Joi.object({
  startTime: Joi.string()
    .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      'string.pattern.base': 'La hora de inicio debe estar en formato HH:mm (24h)',
      'any.required': 'La hora de inicio es requerida'
    }),
  endTime: Joi.string()
    .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      'string.pattern.base': 'La hora de fin debe estar en formato HH:mm (24h)',
      'any.required': 'La hora de fin es requerida'
    })
}).custom((value, helpers) => {
  if (value.startTime >= value.endTime) {
    return helpers.error('custom.timeRange');
  }
  return value;
}).messages({
  'custom.timeRange': 'La hora de inicio debe ser anterior a la hora de fin'
});

const dayScheduleSchema = Joi.object({
  isWorking: Joi.boolean()
    .required()
    .messages({
      'boolean.base': 'isWorking debe ser verdadero o falso',
      'any.required': 'isWorking es requerido'
    }),
  shifts: Joi.array()
    .items(timeSlotSchema)
    .when('isWorking', {
      is: true,
      then: Joi.array().min(1).required(),
      otherwise: Joi.array().length(0)
    })
    .messages({
      'array.min': 'Debe haber al menos un turno si el día es laborable',
      'array.length': 'No debe haber turnos si el día no es laborable'
    })
});

const weeklyScheduleSchema = Joi.object({
  monday: dayScheduleSchema.required(),
  tuesday: dayScheduleSchema.required(),
  wednesday: dayScheduleSchema.required(),
  thursday: dayScheduleSchema.required(),
  friday: dayScheduleSchema.required(),
  saturday: dayScheduleSchema.required(),
  sunday: dayScheduleSchema.required()
});

// Validación para crear profesional
export const createProfessionalSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(255)
    .required()
    .messages({
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'string.max': 'El nombre no puede tener más de 255 caracteres',
      'any.required': 'El nombre es requerido'
    }),
  specialties: Joi.array()
    .items(Joi.string().uuid())
    .min(1)
    .required()
    .messages({
      'array.min': 'Debe especificar al menos una especialidad',
      'string.uuid': 'Cada especialidad debe ser un UUID válido de servicio',
      'any.required': 'Las especialidades son requeridas'
    }),
  schedule: weeklyScheduleSchema.required(),
  isActive: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'isActive debe ser verdadero o falso'
    })
});

// Validación para actualizar profesional
export const updateProfessionalSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(255)
    .optional()
    .messages({
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'string.max': 'El nombre no puede tener más de 255 caracteres'
    }),
  specialties: Joi.array()
    .items(Joi.string().uuid())
    .min(1)
    .optional()
    .messages({
      'array.min': 'Debe especificar al menos una especialidad',
      'string.uuid': 'Cada especialidad debe ser un UUID válido de servicio'
    }),
  schedule: weeklyScheduleSchema.optional(),
  isActive: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'isActive debe ser verdadero o falso'
    })
});

// Validación para consulta de disponibilidad
export const availabilityQuerySchema = Joi.object({
  serviceId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'El ID del servicio debe ser un UUID válido',
      'any.required': 'El ID del servicio es requerido'
    }),
  dateFrom: Joi.date()
    .iso()
    .min('now')
    .required()
    .messages({
      'date.base': 'La fecha de inicio debe ser válida',
      'date.iso': 'La fecha debe estar en formato ISO',
      'date.min': 'La fecha de inicio no puede ser en el pasado',
      'any.required': 'La fecha de inicio es requerida'
    }),
  dateTo: Joi.date()
    .iso()
    .min(Joi.ref('dateFrom'))
    .required()
    .messages({
      'date.base': 'La fecha de fin debe ser válida',
      'date.iso': 'La fecha debe estar en formato ISO',
      'date.min': 'La fecha de fin debe ser posterior a la fecha de inicio',
      'any.required': 'La fecha de fin es requerida'
    }),
  preferredProfessionalId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'El ID del profesional debe ser un UUID válido'
    })
}).custom((value, helpers) => {
  // Validar que el rango no sea mayor a 30 días
  const daysDiff = Math.ceil((value.dateTo.getTime() - value.dateFrom.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff > 30) {
    return helpers.error('custom.dateRange');
  }
  return value;
}).messages({
  'custom.dateRange': 'El rango de fechas no puede ser mayor a 30 días'
});

// Validación para filtros de búsqueda de citas
export const bookingFiltersSchema = Joi.object({
  clientId: Joi.string().uuid().optional(),
  professionalId: Joi.string().uuid().optional(),
  serviceId: Joi.string().uuid().optional(),
  status: Joi.string().valid('confirmed', 'cancelled', 'completed', 'no_show').optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().min(Joi.ref('dateFrom')).optional(),
  page: Joi.number().min(1).optional(),
  limit: Joi.number().min(1).max(100).optional()
}).messages({
  'string.uuid': 'Los IDs deben ser UUIDs válidos',
  'date.iso': 'Las fechas deben estar en formato ISO',
  'date.min': 'La fecha de fin debe ser posterior a la fecha de inicio',
  'any.only': 'El estado debe ser: confirmed, cancelled, completed o no_show',
  'number.min': 'Los números deben ser positivos',
  'number.max': 'El límite máximo es 100'
});
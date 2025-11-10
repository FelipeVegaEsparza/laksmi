import Joi from 'joi';

// Validación para crear servicio
export const createServiceSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'string.max': 'El nombre no puede tener más de 100 caracteres',
      'any.required': 'El nombre es requerido'
    }),
  category: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'La categoría debe tener al menos 2 caracteres',
      'string.max': 'La categoría no puede tener más de 50 caracteres',
      'any.required': 'La categoría es requerida'
    }),
  price: Joi.number()
    .min(0)
    .max(100000)
    .required()
    .messages({
      'number.min': 'El precio debe ser mayor o igual a 0',
      'number.max': 'El precio no puede ser mayor a 100,000',
      'any.required': 'El precio es requerido'
    }),
  duration: Joi.number()
    .min(5)
    .max(480)
    .required()
    .messages({
      'number.min': 'La duración debe ser al menos 5 minutos',
      'number.max': 'La duración no puede ser mayor a 8 horas (480 minutos)',
      'any.required': 'La duración es requerida'
    }),
  description: Joi.string()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'La descripción no puede tener más de 1000 caracteres'
    }),
  images: Joi.array()
    .items(Joi.string().uri())
    .max(10)
    .optional()
    .messages({
      'array.max': 'No se pueden agregar más de 10 imágenes',
      'string.uri': 'Cada imagen debe ser una URL válida'
    }),
  requirements: Joi.array()
    .items(Joi.string().max(200))
    .max(20)
    .optional()
    .messages({
      'array.max': 'No se pueden agregar más de 20 requisitos',
      'string.max': 'Cada requisito no puede tener más de 200 caracteres'
    }),
  isActive: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'isActive debe ser verdadero o falso'
    })
});

// Validación para actualizar servicio
export const updateServiceSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'string.max': 'El nombre no puede tener más de 100 caracteres'
    }),
  category: Joi.string()
    .min(2)
    .max(50)
    .optional()
    .messages({
      'string.min': 'La categoría debe tener al menos 2 caracteres',
      'string.max': 'La categoría no puede tener más de 50 caracteres'
    }),
  price: Joi.number()
    .min(0)
    .max(100000)
    .optional()
    .messages({
      'number.min': 'El precio debe ser mayor o igual a 0',
      'number.max': 'El precio no puede ser mayor a 100,000'
    }),
  duration: Joi.number()
    .min(5)
    .max(480)
    .optional()
    .messages({
      'number.min': 'La duración debe ser al menos 5 minutos',
      'number.max': 'La duración no puede ser mayor a 8 horas (480 minutos)'
    }),
  description: Joi.string()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'La descripción no puede tener más de 1000 caracteres'
    }),
  images: Joi.array()
    .items(Joi.string().uri())
    .max(10)
    .optional()
    .messages({
      'array.max': 'No se pueden agregar más de 10 imágenes',
      'string.uri': 'Cada imagen debe ser una URL válida'
    }),
  requirements: Joi.array()
    .items(Joi.string().max(200))
    .max(20)
    .optional()
    .messages({
      'array.max': 'No se pueden agregar más de 20 requisitos',
      'string.max': 'Cada requisito no puede tener más de 200 caracteres'
    }),
  isActive: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'isActive debe ser verdadero o falso'
    })
});

// Validación para filtros de búsqueda de servicios
export const serviceFiltersSchema = Joi.object({
  category: Joi.string().max(50).optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  minDuration: Joi.number().min(0).optional(),
  maxDuration: Joi.number().min(0).optional(),
  isActive: Joi.boolean().optional(),
  search: Joi.string().max(100).optional(),
  page: Joi.number().min(1).optional(),
  limit: Joi.number().min(1).max(100).optional()
}).custom((value, helpers) => {
  // Validar que minPrice <= maxPrice
  if (value.minPrice !== undefined && value.maxPrice !== undefined && value.minPrice > value.maxPrice) {
    return helpers.error('custom.priceRange');
  }
  
  // Validar que minDuration <= maxDuration
  if (value.minDuration !== undefined && value.maxDuration !== undefined && value.minDuration > value.maxDuration) {
    return helpers.error('custom.durationRange');
  }
  
  return value;
}).messages({
  'custom.priceRange': 'El precio mínimo no puede ser mayor al precio máximo',
  'custom.durationRange': 'La duración mínima no puede ser mayor a la duración máxima'
});
import Joi from 'joi';

// Validación para crear cliente
export const createClientSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[\d\s\-\+\(\)]+$/)
    .min(7)
    .max(20)
    .required()
    .messages({
      'string.pattern.base': 'El teléfono solo puede contener números, espacios, guiones, paréntesis y el símbolo +',
      'string.min': 'El teléfono debe tener al menos 7 caracteres',
      'string.max': 'El teléfono no puede tener más de 20 caracteres',
      'any.required': 'El teléfono es requerido'
    }),
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'string.max': 'El nombre no puede tener más de 100 caracteres',
      'any.required': 'El nombre es requerido'
    }),
  email: Joi.string()
    .email()
    .optional()
    .allow('')
    .messages({
      'string.email': 'Debe ser un email válido'
    }),
  allergies: Joi.array()
    .items(Joi.string().max(100))
    .optional()
    .messages({
      'array.base': 'Las alergias deben ser un array de strings'
    }),
  preferences: Joi.array()
    .items(Joi.string().max(100))
    .optional()
    .messages({
      'array.base': 'Las preferencias deben ser un array de strings'
    })
});

// Validación para actualizar cliente
export const updateClientSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'string.max': 'El nombre no puede tener más de 100 caracteres'
    }),
  email: Joi.string()
    .email()
    .optional()
    .allow('')
    .messages({
      'string.email': 'Debe ser un email válido'
    }),
  allergies: Joi.array()
    .items(Joi.string().max(100))
    .optional()
    .messages({
      'array.base': 'Las alergias deben ser un array de strings'
    }),
  preferences: Joi.array()
    .items(Joi.string().max(100))
    .optional()
    .messages({
      'array.base': 'Las preferencias deben ser un array de strings'
    })
});

// Validación para filtros de búsqueda
export const clientFiltersSchema = Joi.object({
  search: Joi.string().max(100).optional(),
  hasEmail: Joi.boolean().optional(),
  minLoyaltyPoints: Joi.number().min(0).optional(),
  page: Joi.number().min(1).optional(),
  limit: Joi.number().min(1).max(100).optional()
});

// Validación para puntos de lealtad
export const loyaltyPointsSchema = Joi.object({
  points: Joi.number()
    .min(1)
    .max(10000)
    .required()
    .messages({
      'number.min': 'Los puntos deben ser al menos 1',
      'number.max': 'Los puntos no pueden ser más de 10000',
      'any.required': 'Los puntos son requeridos'
    })
});
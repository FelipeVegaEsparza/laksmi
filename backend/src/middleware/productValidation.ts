import Joi from 'joi';

// Validación personalizada para URLs de imágenes más permisiva
const imageUrlSchema = Joi.alternatives().try(
  // URLs completas (http/https)
  Joi.string().uri({ scheme: ['http', 'https'] }),
  // URLs relativas que empiecen con /
  Joi.string().pattern(/^\/uploads\/.+\.(jpg|jpeg|png|gif|webp)$/i),
  // Data URLs para base64
  Joi.string().pattern(/^data:image\/.+;base64,.+$/),
  // String vacío permitido
  Joi.string().allow('')
).messages({
  'alternatives.match': 'Cada imagen debe ser una URL válida (http://, https://, /uploads/ o data:image/)'
});

// Validación para crear producto
export const createProductSchema = Joi.object({
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
  categories: Joi.array()
    .items(Joi.string().min(2).max(50))
    .min(1)
    .max(10)
    .optional()
    .messages({
      'array.min': 'Debe haber al menos una categoría',
      'array.max': 'No se pueden agregar más de 10 categorías',
      'string.min': 'Cada categoría debe tener al menos 2 caracteres',
      'string.max': 'Cada categoría no puede tener más de 50 caracteres'
    }),
  price: Joi.number()
    .min(0)
    .max(10000000)
    .required()
    .messages({
      'number.min': 'El precio debe ser mayor o igual a 0',
      'number.max': 'El precio no puede ser mayor a 10,000,000',
      'any.required': 'El precio es requerido'
    }),
  stock: Joi.number()
    .integer()
    .min(0)
    .max(100000)
    .required()
    .messages({
      'number.base': 'El stock debe ser un número',
      'number.integer': 'El stock debe ser un número entero',
      'number.min': 'El stock debe ser mayor o igual a 0',
      'number.max': 'El stock no puede ser mayor a 100,000',
      'any.required': 'El stock es requerido'
    }),
  minStock: Joi.number()
    .integer()
    .min(0)
    .max(1000)
    .optional()
    .default(5)
    .messages({
      'number.base': 'El stock mínimo debe ser un número',
      'number.integer': 'El stock mínimo debe ser un número entero',
      'number.min': 'El stock mínimo debe ser mayor o igual a 0',
      'number.max': 'El stock mínimo no puede ser mayor a 1,000'
    }),
  description: Joi.string()
    .max(2000)
    .optional()
    .allow('', null)
    .default('')
    .messages({
      'string.max': 'La descripción no puede tener más de 2000 caracteres'
    }),
  images: Joi.array()
    .items(imageUrlSchema)
    .max(10)
    .optional()
    .default([])
    .messages({
      'array.max': 'No se pueden agregar más de 10 imágenes'
    }),
  ingredients: Joi.array()
    .items(Joi.string().max(200))
    .max(50)
    .optional()
    .default([])
    .messages({
      'array.max': 'No se pueden agregar más de 50 ingredientes',
      'string.max': 'Cada ingrediente no puede tener más de 200 caracteres'
    }),
  compatibleServices: Joi.array()
    .items(Joi.string())
    .max(20)
    .optional()
    .default([])
    .messages({
      'array.max': 'No se pueden agregar más de 20 servicios compatibles'
    }),
  paymentLink: Joi.string()
    .max(500)
    .optional()
    .allow('', null)
    .messages({
      'string.max': 'El link de pago no puede tener más de 500 caracteres'
    })
}).options({ stripUnknown: true });

// Validación para actualizar producto
export const updateProductSchema = Joi.object({
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
  categories: Joi.array()
    .items(Joi.string().min(2).max(50))
    .min(1)
    .max(10)
    .optional()
    .messages({
      'array.min': 'Debe haber al menos una categoría',
      'array.max': 'No se pueden agregar más de 10 categorías',
      'string.min': 'Cada categoría debe tener al menos 2 caracteres',
      'string.max': 'Cada categoría no puede tener más de 50 caracteres'
    }),
  price: Joi.number()
    .min(0)
    .max(10000000)
    .optional()
    .messages({
      'number.min': 'El precio debe ser mayor o igual a 0',
      'number.max': 'El precio no puede ser mayor a 10,000,000'
    }),
  stock: Joi.number()
    .integer()
    .min(0)
    .max(100000)
    .optional()
    .messages({
      'number.base': 'El stock debe ser un número',
      'number.integer': 'El stock debe ser un número entero',
      'number.min': 'El stock debe ser mayor o igual a 0',
      'number.max': 'El stock no puede ser mayor a 100,000'
    }),
  minStock: Joi.number()
    .integer()
    .min(0)
    .max(1000)
    .optional()
    .messages({
      'number.base': 'El stock mínimo debe ser un número',
      'number.integer': 'El stock mínimo debe ser un número entero',
      'number.min': 'El stock mínimo debe ser mayor o igual a 0',
      'number.max': 'El stock mínimo no puede ser mayor a 1,000'
    }),
  description: Joi.string()
    .max(2000)
    .optional()
    .allow('', null)
    .messages({
      'string.max': 'La descripción no puede tener más de 2000 caracteres'
    }),
  images: Joi.array()
    .items(imageUrlSchema)
    .max(10)
    .optional()
    .messages({
      'array.max': 'No se pueden agregar más de 10 imágenes'
    }),
  ingredients: Joi.array()
    .items(Joi.string().max(200))
    .max(50)
    .optional()
    .messages({
      'array.max': 'No se pueden agregar más de 50 ingredientes',
      'string.max': 'Cada ingrediente no puede tener más de 200 caracteres'
    }),
  compatibleServices: Joi.array()
    .items(Joi.string())
    .max(20)
    .optional()
    .messages({
      'array.max': 'No se pueden agregar más de 20 servicios compatibles'
    }),
  paymentLink: Joi.string()
    .max(500)
    .optional()
    .allow('', null)
    .messages({
      'string.max': 'El link de pago no puede tener más de 500 caracteres'
    })
}).options({ stripUnknown: true });

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      console.log('❌ Validation error:', errorMessage);
      console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
      res.status(400).json({ 
        error: 'Datos de entrada inválidos',
        details: errorMessage
      });
      return;
    }
    
    next();
  };
};

// Esquemas de validación para autenticación
export const loginSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required()
    .messages({
      'string.alphanum': 'El nombre de usuario solo puede contener letras y números',
      'string.min': 'El nombre de usuario debe tener al menos 3 caracteres',
      'string.max': 'El nombre de usuario no puede tener más de 30 caracteres',
      'any.required': 'El nombre de usuario es requerido'
    }),
  password: Joi.string().min(6).required()
    .messages({
      'string.min': 'La contraseña debe tener al menos 6 caracteres',
      'any.required': 'La contraseña es requerida'
    })
});

export const createUserSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required()
    .messages({
      'string.alphanum': 'El nombre de usuario solo puede contener letras y números',
      'string.min': 'El nombre de usuario debe tener al menos 3 caracteres',
      'string.max': 'El nombre de usuario no puede tener más de 30 caracteres',
      'any.required': 'El nombre de usuario es requerido'
    }),
  email: Joi.string().email().required()
    .messages({
      'string.email': 'Debe ser un email válido',
      'any.required': 'El email es requerido'
    }),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])'))
    .required()
    .messages({
      'string.min': 'La contraseña debe tener al menos 8 caracteres',
      'string.pattern.base': 'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
      'any.required': 'La contraseña es requerida'
    }),
  role: Joi.string().valid('admin', 'manager', 'staff').optional()
    .messages({
      'any.only': 'El rol debe ser admin, manager o staff'
    })
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
    .messages({
      'any.required': 'El refresh token es requerido'
    })
});
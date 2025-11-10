import { Request, Response, NextFunction } from 'express';
import { JWTUtils } from '../utils/jwt';
import { UserModel } from '../models/User';
import logger from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    username: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ error: 'Token de acceso requerido' });
      return;
    }

    const decoded = JWTUtils.verifyAccessToken(token);
    
    // Verificar que el usuario aún existe y está activo
    const user = await UserModel.findById(decoded.userId);
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Usuario no válido o inactivo' });
      return;
    }

    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error: any) {
    logger.error('Authentication error:', error);
    res.status(403).json({ error: 'Token inválido' });
  }
};

export const requireRole = (roles: string | string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Permisos insuficientes' });
      return;
    }

    next();
  };
};

// Middleware específicos para roles
export const requireAdmin = requireRole('admin');
export const requireManagerOrAdmin = requireRole(['admin', 'manager']);
export const requireAnyRole = requireRole(['admin', 'manager', 'staff']);

/**
 * Autenticación para sockets
 */
export const authenticateSocketToken = async (token: string): Promise<{
  userId: string;
  username: string;
  email: string;
  role: string;
}> => {
  try {
    const decoded = JWTUtils.verifyAccessToken(token);
    
    // Verificar que el usuario aún existe y está activo
    const user = await UserModel.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw new Error('Usuario no válido o inactivo');
    }

    return {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role
    };
  } catch (error) {
    logger.error('Socket authentication error:', error);
    throw new Error('Token inválido');
  }
};
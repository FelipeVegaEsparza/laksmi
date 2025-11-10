import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { LoginRequest, CreateUserRequest, RefreshTokenRequest } from '../types/auth';
import { AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';
import { SecurityAuditService } from '../services/SecurityAuditService';

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const credentials: LoginRequest = req.body;
      const result = await AuthService.login(credentials);
      
      // Log successful login
      await SecurityAuditService.logSecurityEvent({
        type: 'LOGIN_SUCCESS',
        userId: result.user.id,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent'),
        severity: 'LOW',
        details: {
          username: credentials.username
        }
      });
      
      res.json({
        success: true,
        message: 'Login exitoso',
        data: result
      });
    } catch (error: any) {
      logger.error('Login error:', error);
      
      // Log failed login attempt
      await SecurityAuditService.logSecurityEvent({
        type: 'LOGIN_FAILURE',
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent'),
        severity: 'MEDIUM',
        details: {
          username: req.body.username,
          error: error.message
        }
      });
      
      res.status(401).json({
        success: false,
        error: error.message || 'Error en el login'
      });
    }
  }

  static async register(req: Request, res: Response): Promise<void> {
    try {
      const userData: CreateUserRequest = req.body;
      const result = await AuthService.createUser(userData);
      
      // Log admin action
      await SecurityAuditService.logSecurityEvent({
        type: 'ADMIN_ACTION',
        userId: (req as AuthenticatedRequest).user?.userId,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent'),
        severity: 'MEDIUM',
        details: {
          action: 'CREATE_USER',
          targetUsername: userData.username
        }
      });
      
      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: result
      });
    } catch (error: any) {
      logger.error('Registration error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al crear usuario'
      });
    }
  }

  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const request: RefreshTokenRequest = req.body;
      const result = await AuthService.refreshToken(request);
      
      res.json({
        success: true,
        message: 'Token renovado exitosamente',
        data: result
      });
    } catch (error: any) {
      logger.error('Refresh token error:', error);
      res.status(401).json({
        success: false,
        error: error.message || 'Error al renovar token'
      });
    }
  }

  static async verify(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Si llegamos aquí, el token es válido (verificado por el middleware)
      res.json({
        success: true,
        message: 'Token válido',
        data: {
          user: req.user
        }
      });
    } catch (error: any) {
      logger.error('Token verification error:', error);
      res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }
  }

  static async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // En una implementación más completa, aquí se podría invalidar el token
      // agregándolo a una blacklist en Redis
      logger.info(`User logged out: ${req.user?.username}`);
      
      res.json({
        success: true,
        message: 'Logout exitoso'
      });
    } catch (error: any) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Error en el logout'
      });
    }
  }

  static async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Perfil obtenido exitosamente',
        data: {
          user: req.user
        }
      });
    } catch (error: any) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener perfil'
      });
    }
  }
}
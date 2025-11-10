import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validateRequest, loginSchema, createUserSchema, refreshTokenSchema } from '../middleware/validation';
import { authRateLimit, loginBruteForce } from '../middleware/security';

const router = Router();

/**
 * @route POST /api/v1/auth/login
 * @desc Login de usuario
 * @access Public
 */
router.post('/login', authRateLimit, loginBruteForce.prevent, validateRequest(loginSchema), AuthController.login);

/**
 * @route POST /api/v1/auth/register
 * @desc Registro de nuevo usuario (solo admin)
 * @access Private (Admin only)
 */
router.post('/register', authenticateToken, requireAdmin, validateRequest(createUserSchema), AuthController.register);

/**
 * @route POST /api/v1/auth/refresh
 * @desc Renovar access token usando refresh token
 * @access Public
 */
router.post('/refresh', authRateLimit, validateRequest(refreshTokenSchema), AuthController.refreshToken);

/**
 * @route GET /api/v1/auth/verify
 * @desc Verificar si el token es válido
 * @access Private
 */
router.get('/verify', authenticateToken, AuthController.verify);

/**
 * @route POST /api/v1/auth/logout
 * @desc Logout de usuario
 * @access Private
 */
router.post('/logout', authenticateToken, AuthController.logout);

/**
 * @route GET /api/v1/auth/profile
 * @desc Obtener perfil del usuario autenticado
 * @access Private
 */
router.get('/profile', authenticateToken, AuthController.getProfile);

export default router;
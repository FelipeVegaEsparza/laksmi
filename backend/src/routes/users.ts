import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación y rol de admin
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @route GET /api/v1/users
 * @desc Obtener todos los usuarios
 * @access Private (Admin only)
 */
router.get('/', UserController.getAllUsers);

/**
 * @route GET /api/v1/users/:id
 * @desc Obtener un usuario por ID
 * @access Private (Admin only)
 */
router.get('/:id', UserController.getUserById);

/**
 * @route POST /api/v1/users
 * @desc Crear nuevo usuario
 * @access Private (Admin only)
 */
router.post('/', UserController.createUser);

/**
 * @route PUT /api/v1/users/:id
 * @desc Actualizar usuario
 * @access Private (Admin only)
 */
router.put('/:id', UserController.updateUser);

/**
 * @route PUT /api/v1/users/:id/password
 * @desc Cambiar contraseña de usuario
 * @access Private (Admin only)
 */
router.put('/:id/password', UserController.changeUserPassword);

/**
 * @route DELETE /api/v1/users/:id
 * @desc Eliminar usuario
 * @access Private (Admin only)
 */
router.delete('/:id', UserController.deleteUser);

export default router;

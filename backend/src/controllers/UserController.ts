import { Response } from 'express';
import { UserModel } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';

export class UserController {
  /**
   * Obtener todos los usuarios (solo admin)
   */
  static async getAllUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { role, isActive } = req.query;
      
      const filters: any = {};
      if (role) filters.role = role as string;
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      
      const users = await UserModel.findAll(filters);
      
      // Remover password_hash de la respuesta
      const sanitizedUsers = users.map(user => {
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json({
        success: true,
        data: sanitizedUsers
      });
    } catch (error: any) {
      logger.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error fetching users'
      });
    }
  }

  /**
   * Obtener un usuario por ID (solo admin)
   */
  static async getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const user = await UserModel.findById(id);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }
      
      // Remover password_hash de la respuesta
      const { passwordHash, ...userWithoutPassword } = user;
      
      res.json({
        success: true,
        data: userWithoutPassword
      });
    } catch (error: any) {
      logger.error('Get user by ID error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error fetching user'
      });
    }
  }

  /**
   * Crear nuevo usuario (solo admin)
   */
  static async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { username, email, password, role } = req.body;
      
      // Validaciones
      if (!username || !email || !password) {
        res.status(400).json({
          success: false,
          error: 'Username, email and password are required'
        });
        return;
      }
      
      // Verificar si el usuario ya existe
      const existingUser = await UserModel.findByUsername(username);
      if (existingUser) {
        res.status(400).json({
          success: false,
          error: 'Username already exists'
        });
        return;
      }
      
      const existingEmail = await UserModel.findByEmail(email);
      if (existingEmail) {
        res.status(400).json({
          success: false,
          error: 'Email already exists'
        });
        return;
      }
      
      const user = await UserModel.create({
        username,
        email,
        password,
        role: role || 'staff'
      });
      
      // Remover password_hash de la respuesta
      const { passwordHash, ...userWithoutPassword } = user;
      
      logger.info(`User created: ${user.id} by admin ${req.user?.userId}`);
      
      res.status(201).json({
        success: true,
        data: userWithoutPassword,
        message: 'User created successfully'
      });
    } catch (error: any) {
      logger.error('Create user error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error creating user'
      });
    }
  }

  /**
   * Actualizar usuario (solo admin)
   */
  static async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { username, email, role, isActive } = req.body;
      
      const user = await UserModel.findById(id);
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }
      
      // No permitir que el admin se desactive a sí mismo
      if (id === req.user?.userId && isActive === false) {
        res.status(400).json({
          success: false,
          error: 'Cannot deactivate your own account'
        });
        return;
      }
      
      const updateData: any = {};
      if (username) updateData.username = username;
      if (email) updateData.email = email;
      if (role) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive;
      
      const updated = await UserModel.update(id, updateData);
      
      if (!updated) {
        res.status(500).json({
          success: false,
          error: 'Error updating user'
        });
        return;
      }
      
      const updatedUser = await UserModel.findById(id);
      const { passwordHash, ...userWithoutPassword } = updatedUser!;
      
      logger.info(`User updated: ${id} by admin ${req.user?.userId}`);
      
      res.json({
        success: true,
        data: userWithoutPassword,
        message: 'User updated successfully'
      });
    } catch (error: any) {
      logger.error('Update user error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error updating user'
      });
    }
  }

  /**
   * Cambiar contraseña de usuario (solo admin)
   */
  static async changeUserPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 6) {
        res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters long'
        });
        return;
      }
      
      const user = await UserModel.findById(id);
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }
      
      const updated = await UserModel.updatePassword(id, newPassword);
      
      if (!updated) {
        res.status(500).json({
          success: false,
          error: 'Error updating password'
        });
        return;
      }
      
      logger.info(`Password changed for user: ${id} by admin ${req.user?.userId}`);
      
      res.json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error: any) {
      logger.error('Change user password error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error changing password'
      });
    }
  }

  /**
   * Eliminar usuario (solo admin)
   */
  static async deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // No permitir que el admin se elimine a sí mismo
      if (id === req.user?.userId) {
        res.status(400).json({
          success: false,
          error: 'Cannot delete your own account'
        });
        return;
      }
      
      const user = await UserModel.findById(id);
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }
      
      const deleted = await UserModel.delete(id);
      
      if (!deleted) {
        res.status(500).json({
          success: false,
          error: 'Error deleting user'
        });
        return;
      }
      
      logger.info(`User deleted: ${id} by admin ${req.user?.userId}`);
      
      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error: any) {
      logger.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error deleting user'
      });
    }
  }
}

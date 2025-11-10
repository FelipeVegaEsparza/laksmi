import { UserModel } from '../models/User';
import { JWTUtils } from '../utils/jwt';
import { LoginRequest, LoginResponse, CreateUserRequest, RefreshTokenRequest, RefreshTokenResponse } from '../types/auth';
import logger from '../utils/logger';

export class AuthService {
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    const { username, password } = credentials;

    // Buscar usuario por username
    const user = await UserModel.findByUsername(username);
    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    // Verificar que el usuario esté activo
    if (!user.isActive) {
      throw new Error('Usuario inactivo');
    }

    // Validar contraseña
    const isValidPassword = await UserModel.validatePassword(user, password);
    if (!isValidPassword) {
      throw new Error('Credenciales inválidas');
    }

    // Actualizar último login
    await UserModel.updateLastLogin(user.id);

    // Generar tokens
    const tokens = JWTUtils.generateTokenPair({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });

    logger.info(`User logged in: ${user.username}`);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }

  static async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    try {
      const decoded = JWTUtils.verifyRefreshToken(request.refreshToken);
      
      // Verificar que el usuario aún existe y está activo
      const user = await UserModel.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new Error('Usuario no válido');
      }

      // Generar nuevos tokens
      const tokens = JWTUtils.generateTokenPair({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      });

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      };
    } catch (error) {
      throw new Error('Refresh token inválido');
    }
  }

  static async createUser(userData: CreateUserRequest): Promise<LoginResponse> {
    // Verificar que el username no exista
    const existingUser = await UserModel.findByUsername(userData.username);
    if (existingUser) {
      throw new Error('El nombre de usuario ya existe');
    }

    // Verificar que el email no exista
    const existingEmail = await UserModel.findByEmail(userData.email);
    if (existingEmail) {
      throw new Error('El email ya está registrado');
    }

    // Crear usuario
    const user = await UserModel.create(userData);

    // Generar tokens
    const tokens = JWTUtils.generateTokenPair({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });

    logger.info(`New user created: ${user.username}`);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }

  static async verifyToken(token: string): Promise<boolean> {
    try {
      const decoded = JWTUtils.verifyAccessToken(token);
      const user = await UserModel.findById(decoded.userId);
      return user !== null && user.isActive;
    } catch (error) {
      return false;
    }
  }
}
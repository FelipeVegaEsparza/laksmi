import db from '../config/database';
import bcrypt from 'bcrypt';

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'manager' | 'staff';
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class UserModel {
  static async findById(id: string): Promise<User | null> {
    const user = await db('users').where({ id }).first();
    if (!user) return null;
    
    return this.formatUser(user);
  }

  static async findByUsername(username: string): Promise<User | null> {
    const user = await db('users').where({ username }).first();
    if (!user) return null;
    
    return this.formatUser(user);
  }

  static async findByEmail(email: string): Promise<User | null> {
    const user = await db('users').where({ email }).first();
    if (!user) return null;
    
    return this.formatUser(user);
  }

  static async findAll(filters?: {
    role?: string;
    isActive?: boolean;
  }): Promise<User[]> {
    let query = db('users');
    
    if (filters?.role) {
      query = query.where({ role: filters.role });
    }
    
    if (filters?.isActive !== undefined) {
      query = query.where({ is_active: filters.isActive });
    }
    
    const users = await query.orderBy('created_at', 'desc');
    return users.map(user => this.formatUser(user));
  }

  static async create(userData: {
    username: string;
    email: string;
    password: string;
    role?: 'admin' | 'manager' | 'staff';
  }): Promise<User> {
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(userData.password, saltRounds);
    
    const insertData = {
      username: userData.username,
      email: userData.email,
      password_hash: passwordHash,
      role: userData.role || 'staff',
      is_active: true
    };

    await db('users').insert(insertData);

    // Buscar el usuario recién creado
    const user = await db('users')
      .where({ username: userData.username })
      .first();
    
    if (!user) {
      throw new Error('Error creating user');
    }

    return this.formatUser(user);
  }

  static async updateLastLogin(id: string): Promise<void> {
    await db('users')
      .where({ id })
      .update({
        last_login: new Date(),
        updated_at: new Date()
      });
  }

  static async updatePassword(id: string, newPassword: string): Promise<boolean> {
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    const result = await db('users')
      .where({ id })
      .update({
        password_hash: passwordHash,
        updated_at: new Date()
      });
    
    return result > 0;
  }

  static async updateRole(id: string, role: 'admin' | 'manager' | 'staff'): Promise<boolean> {
    const result = await db('users')
      .where({ id })
      .update({
        role,
        updated_at: new Date()
      });
    
    return result > 0;
  }

  static async deactivate(id: string): Promise<boolean> {
    const result = await db('users')
      .where({ id })
      .update({
        is_active: false,
        updated_at: new Date()
      });
    
    return result > 0;
  }

  static async activate(id: string): Promise<boolean> {
    const result = await db('users')
      .where({ id })
      .update({
        is_active: true,
        updated_at: new Date()
      });
    
    return result > 0;
  }

  static async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  static async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  static async getActiveManagers(): Promise<User[]> {
    const users = await db('users')
      .whereIn('role', ['manager', 'admin'])
      .where({ is_active: true })
      .orderBy('role', 'desc'); // admin primero, luego manager
    
    return users.map(user => this.formatUser(user));
  }

  static async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    usersByRole: Record<string, number>;
    recentLogins: number;
  }> {
    // Total de usuarios
    const [totalResult] = await db('users').count('* as count');
    const totalUsers = parseInt(totalResult.count as string);

    // Usuarios activos
    const [activeResult] = await db('users').where({ is_active: true }).count('* as count');
    const activeUsers = parseInt(activeResult.count as string);

    // Usuarios por rol
    const roleStats = await db('users')
      .select('role')
      .count('* as count')
      .groupBy('role');

    const usersByRole: Record<string, number> = {};
    roleStats.forEach(row => {
      usersByRole[row.role] = parseInt(row.count as string);
    });

    // Logins recientes (últimas 24 horas)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const [recentResult] = await db('users')
      .where('last_login', '>=', yesterday)
      .count('* as count');
    const recentLogins = parseInt(recentResult.count as string);

    return {
      totalUsers,
      activeUsers,
      usersByRole,
      recentLogins
    };
  }

  private static formatUser(dbUser: any): User {
    return {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      passwordHash: dbUser.password_hash,
      role: dbUser.role,
      isActive: dbUser.is_active,
      lastLogin: dbUser.last_login ? new Date(dbUser.last_login) : undefined,
      createdAt: new Date(dbUser.created_at),
      updatedAt: new Date(dbUser.updated_at)
    };
  }
}
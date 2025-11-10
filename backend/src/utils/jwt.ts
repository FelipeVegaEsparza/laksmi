import * as jwt from 'jsonwebtoken';
import config from '../config';
import { JWTPayload } from '../types/auth';

export class JWTUtils {
  static generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: '1h' // Valor fijo por ahora
    });
  }

  static generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: '7d' // Valor fijo por ahora
    });
  }

  static verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      return decoded as JWTPayload;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  static verifyRefreshToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret);
      return decoded as JWTPayload;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  static generateTokenPair(user: { id: string; username: string; email: string; role: string }) {
    const payload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload)
    };
  }
}
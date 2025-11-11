import { ClientModel } from '../../models/Client';
import { ConversationModel } from '../../models/Conversation';
import { ContextManager } from './ContextManager';
import logger from '../../utils/logger';
import crypto from 'crypto';

export interface AuthVerificationResult {
  isVerified: boolean;
  message: string;
  requiresVerification: boolean;
  verificationMethod?: 'phone' | 'email' | 'code';
  verificationToken?: string;
}

export class ChatAuthService {
  private static verificationCodes = new Map<string, {
    code: string;
    clientId: string;
    expiresAt: Date;
    attempts: number;
  }>();

  /**
   * Verificar si el cliente está autenticado para acciones sensibles
   */
  static async verifyClientForSensitiveAction(
    clientId: string,
    conversationId: string,
    action: 'cancel' | 'reschedule' | 'view_bookings'
  ): Promise<AuthVerificationResult> {
    try {
      // 1. Verificar si ya está verificado en esta sesión
      const isVerified = await this.isClientVerifiedInSession(conversationId);
      
      if (isVerified) {
        return {
          isVerified: true,
          message: 'Cliente verificado',
          requiresVerification: false
        };
      }

      // 2. Obtener información del cliente
      const client = await ClientModel.findById(clientId);
      if (!client) {
        return {
          isVerified: false,
          message: 'Cliente no encontrado',
          requiresVerification: false
        };
      }

      // 3. Verificar que tenga email
      const hasEmail = !!client.email;

      if (!hasEmail) {
        return {
          isVerified: false,
          message: '⚠️ Por seguridad, necesito verificar tu identidad. No tengo un email registrado para ti. Por favor, contacta directamente a la clínica para gestionar tu reserva.',
          requiresVerification: true,
          verificationMethod: undefined
        };
      }

      // 4. Generar código de verificación
      const verificationCode = this.generateVerificationCode();
      const verificationToken = this.generateVerificationToken();

      // Guardar código con expiración de 10 minutos
      this.verificationCodes.set(verificationToken, {
        code: verificationCode,
        clientId,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        attempts: 0
      });

      // Guardar token en contexto
      await ContextManager.setVariable(conversationId, 'verificationToken', verificationToken);
      await ContextManager.setVariable(conversationId, 'pendingAction', action);

      // 5. Enviar código por email
      const { EmailService } = await import('../EmailService');
      const clientEmail = client.email!; // Ya validamos que existe arriba
      const emailSent = await EmailService.sendVerificationCode(
        clientEmail,
        verificationCode,
        client.name
      );

      // 6. Preparar mensaje de respuesta
      let message = '🔒 **Verificación de Seguridad**\n\n';
      message += 'Por tu seguridad, necesito verificar tu identidad antes de continuar.\n\n';

      if (emailSent) {
        message += `📧 Te he enviado un código de verificación al email **${this.maskEmail(clientEmail)}**\n\n`;
        message += `Por favor, revisa tu bandeja de entrada (y carpeta de spam) y responde con el código de 6 dígitos que recibiste.\n\n`;
        message += `⏰ El código expira en 10 minutos.`;
      } else {
        // Fallback si el email no se pudo enviar
        message += `📧 Intenté enviarte un código al email **${this.maskEmail(clientEmail)}**, pero hubo un problema.\n\n`;
        message += `⚠️ **CÓDIGO TEMPORAL:** ${verificationCode}\n\n`;
        message += `Por favor, responde con este código para continuar.`;
      }
      
      return {
        isVerified: false,
        message,
        requiresVerification: true,
        verificationMethod: 'email',
        verificationToken
      };

      return {
        isVerified: false,
        message: 'Error en el sistema de verificación',
        requiresVerification: true
      };

    } catch (error) {
      logger.error('Error in client verification:', error);
      return {
        isVerified: false,
        message: 'Error al verificar identidad. Por favor, contacta a la clínica.',
        requiresVerification: true
      };
    }
  }

  /**
   * Validar código de verificación ingresado por el usuario
   */
  static async validateVerificationCode(
    conversationId: string,
    userCode: string
  ): Promise<{
    isValid: boolean;
    message: string;
    clientVerified?: boolean;
  }> {
    try {
      // Obtener token de verificación del contexto
      const verificationToken = await ContextManager.getVariable(conversationId, 'verificationToken');
      
      if (!verificationToken) {
        return {
          isValid: false,
          message: 'No hay un proceso de verificación activo. Por favor, intenta nuevamente la acción que deseas realizar.'
        };
      }

      const verification = this.verificationCodes.get(verificationToken);
      
      if (!verification) {
        return {
          isValid: false,
          message: 'El código de verificación ha expirado. Por favor, solicita uno nuevo.'
        };
      }

      // Verificar expiración
      if (new Date() > verification.expiresAt) {
        this.verificationCodes.delete(verificationToken);
        await ContextManager.setVariable(conversationId, 'verificationToken', null);
        
        return {
          isValid: false,
          message: '⏰ El código ha expirado (10 minutos). Por favor, solicita uno nuevo intentando la acción nuevamente.'
        };
      }

      // Incrementar intentos
      verification.attempts++;

      // Verificar máximo de intentos
      if (verification.attempts > 3) {
        this.verificationCodes.delete(verificationToken);
        await ContextManager.setVariable(conversationId, 'verificationToken', null);
        
        return {
          isValid: false,
          message: '⚠️ Has excedido el número máximo de intentos. Por seguridad, debes solicitar un nuevo código.'
        };
      }

      // Validar código (normalizar: remover espacios, guiones, etc.)
      const normalizedUserCode = userCode.replace(/[\s-]/g, '');
      const normalizedStoredCode = verification.code.replace(/[\s-]/g, '');

      if (normalizedUserCode !== normalizedStoredCode) {
        const remainingAttempts = 3 - verification.attempts;
        return {
          isValid: false,
          message: `❌ Código incorrecto. Te quedan ${remainingAttempts} intentos.`
        };
      }

      // ✅ Código válido
      // Marcar cliente como verificado en esta sesión
      await ContextManager.setVariable(conversationId, 'clientVerified', true);
      await ContextManager.setVariable(conversationId, 'verifiedAt', new Date().toISOString());
      await ContextManager.setVariable(conversationId, 'verificationToken', null);
      
      // Limpiar código usado
      this.verificationCodes.delete(verificationToken);

      // Obtener acción pendiente
      const pendingAction = await ContextManager.getVariable(conversationId, 'pendingAction') as string | undefined;
      
      let message = '✅ **Identidad verificada correctamente**\n\n';
      
      if (pendingAction) {
        message += 'Ahora puedes continuar con tu solicitud. ¿Qué te gustaría hacer?';
      } else {
        message += 'Tu sesión está verificada. Puedes gestionar tus reservas con seguridad.';
      }

      return {
        isValid: true,
        message,
        clientVerified: true
      };

    } catch (error) {
      logger.error('Error validating verification code:', error);
      return {
        isValid: false,
        message: 'Error al validar el código. Por favor, intenta nuevamente.'
      };
    }
  }

  /**
   * Verificar si el cliente ya está verificado en esta sesión
   */
  static async isClientVerifiedInSession(conversationId: string): Promise<boolean> {
    try {
      const isVerified = await ContextManager.getVariable(conversationId, 'clientVerified');
      const verifiedAt = await ContextManager.getVariable(conversationId, 'verifiedAt');

      if (!isVerified || !verifiedAt) {
        return false;
      }

      // Verificación válida por 30 minutos
      const verifiedTime = new Date(verifiedAt);
      const now = new Date();
      const minutesSinceVerification = (now.getTime() - verifiedTime.getTime()) / (1000 * 60);

      if (minutesSinceVerification > 30) {
        // Expiró la verificación
        await ContextManager.setVariable(conversationId, 'clientVerified', false);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error checking verification status:', error);
      return false;
    }
  }

  /**
   * Detectar si el mensaje es un código de verificación
   */
  static isVerificationCodeMessage(message: string): boolean {
    // Detectar patrones de código: 6 dígitos con o sin espacios/guiones
    const codePattern = /^\d{6}$|^\d{3}[\s-]?\d{3}$/;
    return codePattern.test(message.trim());
  }

  /**
   * Generar código de verificación de 6 dígitos
   */
  private static generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generar token único para la verificación
   */
  private static generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Enmascarar número de teléfono
   */
  private static maskPhone(phone: string): string {
    if (!phone || phone.length < 4) return '****';
    return '****' + phone.slice(-4);
  }

  /**
   * Enmascarar email
   */
  private static maskEmail(email: string): string {
    if (!email) return '****@****.com';
    const [local, domain] = email.split('@');
    if (!local || !domain) return '****@****.com';
    
    const maskedLocal = local.length > 2 
      ? local[0] + '***' + local[local.length - 1]
      : '***';
    
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Limpiar códigos expirados (ejecutar periódicamente)
   */
  static cleanupExpiredCodes(): number {
    const now = new Date();
    let cleaned = 0;

    for (const [token, verification] of this.verificationCodes.entries()) {
      if (now > verification.expiresAt) {
        this.verificationCodes.delete(token);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} expired verification codes`);
    }

    return cleaned;
  }

  /**
   * Obtener estadísticas de verificación
   */
  static getStats(): {
    activeVerifications: number;
    totalAttempts: number;
  } {
    this.cleanupExpiredCodes();
    
    let totalAttempts = 0;
    for (const verification of this.verificationCodes.values()) {
      totalAttempts += verification.attempts;
    }

    return {
      activeVerifications: this.verificationCodes.size,
      totalAttempts
    };
  }
}

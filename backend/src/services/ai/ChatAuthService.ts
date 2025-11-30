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
  verificationLevel?: number;
}

// Niveles de seguridad para acciones
export const ACTION_SECURITY_LEVELS = {
  // Nivel 0: Sin verificación (información pública)
  'view_services': 0,
  'view_prices': 0,
  'view_products': 0,
  'general_inquiry': 0,
  
  // Nivel 1: Verificación ligera (teléfono)
  'view_my_bookings': 1,
  'confirm_booking': 1,
  'view_history': 1,
  'view_loyalty_points': 1,
  
  // Nivel 2: Verificación fuerte (email + código)
  'cancel_booking': 2,
  'reschedule_booking': 2,
  'update_personal_data': 2,
  'view_payment_info': 2,
  'request_refund': 2,
} as const;

export type SecurityAction = keyof typeof ACTION_SECURITY_LEVELS;

export class ChatAuthService {
  private static verificationCodes = new Map<string, {
    code: string;
    clientId: string;
    expiresAt: Date;
    attempts: number;
  }>();

  /**
   * Obtener nivel de seguridad requerido para una acción
   */
  static getRequiredVerificationLevel(action: string): number {
    // Mapear acciones antiguas a nuevas
    const actionMap: Record<string, SecurityAction> = {
      'cancel': 'cancel_booking',
      'reschedule': 'reschedule_booking',
      'view_bookings': 'view_my_bookings',
    };
    
    const mappedAction = actionMap[action] || action;
    return ACTION_SECURITY_LEVELS[mappedAction as SecurityAction] ?? 2; // Default: nivel 2 (más seguro)
  }

  /**
   * Verificar si el cliente está autenticado para acciones sensibles
   * Ahora con soporte para múltiples niveles de verificación
   */
  static async verifyClientForSensitiveAction(
    clientId: string,
    conversationId: string,
    action: 'cancel' | 'reschedule' | 'view_bookings' | SecurityAction
  ): Promise<AuthVerificationResult> {
    try {
      // 1. Determinar nivel de seguridad requerido
      const requiredLevel = this.getRequiredVerificationLevel(action);
      
      // 2. Verificar si ya está verificado en esta sesión
      const currentLevel = await this.getCurrentVerificationLevel(conversationId);
      
      if (currentLevel >= requiredLevel) {
        return {
          isVerified: true,
          message: 'Cliente verificado',
          requiresVerification: false,
          verificationLevel: currentLevel
        };
      }

      // 3. Obtener información del cliente
      const client = await ClientModel.findById(clientId);
      if (!client) {
        return {
          isVerified: false,
          message: 'Cliente no encontrado',
          requiresVerification: false
        };
      }

      // 4. Verificación según nivel requerido
      if (requiredLevel === 1) {
        // Nivel 1: Verificación ligera por teléfono
        return await this.requestPhoneVerification(client, conversationId, action);
      } else if (requiredLevel === 2) {
        // Nivel 2: Verificación fuerte por email
        return await this.requestEmailVerification(client, conversationId, action);
      }

      // Nivel 0: No requiere verificación
      return {
        isVerified: true,
        message: 'No requiere verificación',
        requiresVerification: false,
        verificationLevel: 0
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
   * Solicitar verificación ligera por teléfono (Nivel 1)
   */
  private static async requestPhoneVerification(
    client: any,
    conversationId: string,
    action: string
  ): Promise<AuthVerificationResult> {
    // Guardar acción pendiente
    await ContextManager.setVariable(conversationId, 'pendingAction', action);
    await ContextManager.setVariable(conversationId, 'awaitingPhoneVerification', true);

    const maskedPhone = this.maskPhone(client.phone);
    
    let message = '📱 **Verificación Rápida**\n\n';
    message += 'Para continuar, confirma tu número de teléfono.\n\n';
    message += `¿Tu número termina en **${maskedPhone.slice(-4)}**?\n\n`;
    message += 'Responde "sí" para confirmar o escribe tu número completo.';

    return {
      isVerified: false,
      message,
      requiresVerification: true,
      verificationMethod: 'phone',
      verificationLevel: 1
    };
  }

  /**
   * Solicitar verificación fuerte por email (Nivel 2)
   */
  private static async requestEmailVerification(
    client: any,
    conversationId: string,
    action: string
  ): Promise<AuthVerificationResult> {
    // Guardar acción pendiente SIEMPRE (antes de verificar si tiene email)
    await ContextManager.setVariable(conversationId, 'pendingAction', action);
    await ContextManager.setVariable(conversationId, 'pendingClientId', client.id);
    
    // Verificar que tenga email
    const hasEmail = !!client.email;

    if (!hasEmail) {
      // Solicitar email al usuario
      await ContextManager.setVariable(conversationId, 'awaitingEmailInput', true);
      
      return {
        isVerified: false,
        message: '📧 **Verificación de Seguridad**\n\nPara continuar, necesito verificar tu identidad.\n\n¿Cuál es tu correo electrónico?',
        requiresVerification: true,
        verificationMethod: 'email'
      };
    }

    // Generar código de verificación
    const verificationCode = this.generateVerificationCode();
    const verificationToken = this.generateVerificationToken();

    // Guardar código con expiración de 10 minutos
    this.verificationCodes.set(verificationToken, {
      code: verificationCode,
      clientId: client.id,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0
    });

    // Guardar token en contexto
    await ContextManager.setVariable(conversationId, 'verificationToken', verificationToken);
    await ContextManager.setVariable(conversationId, 'pendingAction', action);

    // Enviar código por email
    const { EmailService } = await import('../EmailService');
    const clientEmail = client.email!;
    const emailSent = await EmailService.sendVerificationCode(
      clientEmail,
      verificationCode,
      client.name
    );

    // Preparar mensaje de respuesta
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
      verificationToken,
      verificationLevel: 2
    };
  }

  /**
   * Validar verificación por teléfono (Nivel 1)
   */
  static async validatePhoneVerification(
    conversationId: string,
    clientId: string,
    userResponse: string
  ): Promise<AuthVerificationResult> {
    try {
      const client = await ClientModel.findById(clientId);
      if (!client) {
        return {
          isVerified: false,
          message: 'Cliente no encontrado',
          requiresVerification: false
        };
      }

      const normalizedResponse = userResponse.toLowerCase().trim();
      const normalizedPhone = client.phone.replace(/[\s\-\+]/g, '');
      const userPhone = userResponse.replace(/[\s\-\+]/g, '');

      // Verificar si dijo "sí" o proporcionó el teléfono correcto
      const isConfirmed = normalizedResponse === 'si' || 
                         normalizedResponse === 'sí' || 
                         normalizedResponse === 'yes' ||
                         userPhone.endsWith(normalizedPhone.slice(-4)) ||
                         userPhone === normalizedPhone;

      if (isConfirmed) {
        // Marcar como verificado nivel 1
        await ContextManager.setVariable(conversationId, 'verificationLevel', 1);
        await ContextManager.setVariable(conversationId, 'verifiedAt', new Date().toISOString());
        await ContextManager.setVariable(conversationId, 'awaitingPhoneVerification', false);

        return {
          isVerified: true,
          message: '✅ Identidad verificada. ¿En qué puedo ayudarte?',
          requiresVerification: false,
          verificationLevel: 1
        };
      } else {
        return {
          isVerified: false,
          message: '❌ El número no coincide. Por favor, verifica e intenta nuevamente o contacta a la clínica.',
          requiresVerification: true,
          verificationMethod: 'phone'
        };
      }
    } catch (error) {
      logger.error('Error validating phone verification:', error);
      return {
        isVerified: false,
        message: 'Error al verificar teléfono. Por favor, intenta nuevamente.',
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
      // Marcar cliente como verificado nivel 2 en esta sesión
      await ContextManager.setVariable(conversationId, 'clientVerified', true);
      await ContextManager.setVariable(conversationId, 'verificationLevel', 2);
      await ContextManager.setVariable(conversationId, 'verifiedAt', new Date().toISOString());
      await ContextManager.setVariable(conversationId, 'verificationToken', null);
      
      // Limpiar código usado
      this.verificationCodes.delete(verificationToken);

      // Obtener acción pendiente y cliente ID
      const pendingAction = await ContextManager.getVariable(conversationId, 'pendingAction') as string | undefined;
      const pendingClientId = await ContextManager.getVariable(conversationId, 'pendingClientId') as string | undefined;
      
      let message = '✅ **Identidad verificada correctamente**\n\n';
      
      if (pendingAction && pendingClientId) {
        // Dar mensaje específico según la acción pendiente
        if (pendingAction === 'cancel' || pendingAction === 'cancel_booking') {
          // Obtener reservas activas del cliente
          try {
            const { BookingManagementService } = await import('./BookingManagementService');
            const bookings = await BookingManagementService.getClientActiveBookings(pendingClientId);
            
            if (bookings.length === 0) {
              message += 'No tienes reservas activas para cancelar en este momento.';
            } else if (bookings.length === 1) {
              // Si solo tiene una reserva, mostrarla y preguntar si quiere cancelarla
              const booking = bookings[0];
              const bookingDate = new Date(booking.date);
              const dateStr = bookingDate.toLocaleDateString('es-CL', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long',
                hour: '2-digit',
                minute: '2-digit'
              });
              
              message += `Tienes la siguiente reserva activa:\n\n`;
              message += `📅 **${booking.serviceName}**\n`;
              message += `🕐 ${dateStr}\n`;
              message += `⏱️ ${booking.duration} minutos\n`;
              message += `💰 ${booking.price}\n\n`;
              message += '¿Deseas cancelar esta reserva? Responde "sí" para confirmar.';
            } else {
              // Múltiples reservas, mostrar lista
              message += `Tienes ${bookings.length} reservas activas:\n\n`;
              
              bookings.forEach((booking: any, index: number) => {
                const bookingDate = new Date(booking.date);
                const dateStr = bookingDate.toLocaleDateString('es-CL', { 
                  weekday: 'short', 
                  day: 'numeric', 
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                
                message += `${index + 1}️⃣ **${booking.serviceName}**\n`;
                message += `   📅 ${dateStr}\n`;
                message += `   ⏱️ ${booking.duration} min | 💰 ${booking.price}\n\n`;
              });
              
              message += '¿Cuál deseas cancelar? Puedes decirme:\n';
              message += '• El número (1, 2, 3...)\n';
              message += '• "La de hoy" o "La de mañana"\n';
              message += '• El nombre del servicio';
            }
          } catch (error) {
            logger.error('Error fetching bookings for verification message:', error);
            message += 'Perfecto, ahora puedo ayudarte a cancelar tu reserva.\n\n';
            message += '¿Cuál reserva deseas cancelar? Puedes decirme "la de hoy", "la de mañana" o el nombre del servicio.';
          }
        } else if (pendingAction === 'reschedule' || pendingAction === 'reschedule_booking') {
          // Similar para reagendar
          try {
            const { BookingManagementService } = await import('./BookingManagementService');
            const bookings = await BookingManagementService.getClientActiveBookings(pendingClientId);
            
            if (bookings.length === 0) {
              message += 'No tienes reservas activas para reagendar en este momento.';
            } else if (bookings.length === 1) {
              const booking = bookings[0];
              const bookingDate = new Date(booking.date);
              const dateStr = bookingDate.toLocaleDateString('es-CL', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long',
                hour: '2-digit',
                minute: '2-digit'
              });
              
              message += `Tienes la siguiente reserva activa:\n\n`;
              message += `📅 **${booking.serviceName}**\n`;
              message += `🕐 ${dateStr}\n`;
              message += `⏱️ ${booking.duration} minutos\n`;
              message += `💰 ${booking.price}\n\n`;
              message += '¿Deseas reagendar esta reserva? Responde "sí" para continuar.';
            } else {
              message += `Tienes ${bookings.length} reservas activas:\n\n`;
              
              bookings.forEach((booking: any, index: number) => {
                const bookingDate = new Date(booking.date);
                const dateStr = bookingDate.toLocaleDateString('es-CL', { 
                  weekday: 'short', 
                  day: 'numeric', 
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                
                message += `${index + 1}️⃣ **${booking.serviceName}**\n`;
                message += `   📅 ${dateStr}\n`;
                message += `   ⏱️ ${booking.duration} min | 💰 ${booking.price}\n\n`;
              });
              
              message += '¿Cuál deseas reagendar? Puedes decirme:\n';
              message += '• El número (1, 2, 3...)\n';
              message += '• "La de hoy" o "La de mañana"\n';
              message += '• El nombre del servicio';
            }
          } catch (error) {
            logger.error('Error fetching bookings for verification message:', error);
            message += 'Perfecto, ahora puedo ayudarte a reagendar tu reserva.\n\n';
            message += '¿Cuál reserva deseas reagendar? Puedes decirme "la de hoy", "la de mañana" o el nombre del servicio.';
          }
        } else {
          message += 'Ahora puedes continuar con tu solicitud. ¿Qué te gustaría hacer?';
        }
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
   * Obtener nivel de verificación actual de la sesión
   */
  static async getCurrentVerificationLevel(conversationId: string): Promise<number> {
    try {
      const verificationLevel = await ContextManager.getVariable(conversationId, 'verificationLevel');
      const verifiedAt = await ContextManager.getVariable(conversationId, 'verifiedAt');

      if (!verificationLevel || !verifiedAt) {
        return 0; // Sin verificación
      }

      // Verificación válida por 30 minutos
      const verifiedTime = new Date(verifiedAt);
      const now = new Date();
      const minutesSinceVerification = (now.getTime() - verifiedTime.getTime()) / (1000 * 60);

      if (minutesSinceVerification > 30) {
        // Expiró la verificación
        await ContextManager.setVariable(conversationId, 'verificationLevel', 0);
        await ContextManager.setVariable(conversationId, 'clientVerified', false);
        return 0;
      }

      return verificationLevel as number;
    } catch (error) {
      logger.error('Error checking verification level:', error);
      return 0;
    }
  }

  /**
   * Verificar si el cliente ya está verificado en esta sesión (legacy)
   */
  static async isClientVerifiedInSession(conversationId: string): Promise<boolean> {
    const level = await this.getCurrentVerificationLevel(conversationId);
    return level > 0;
  }

  /**
   * Verificar si está esperando verificación por teléfono
   */
  static async isAwaitingPhoneVerification(conversationId: string): Promise<boolean> {
    try {
      const awaiting = await ContextManager.getVariable(conversationId, 'awaitingPhoneVerification');
      return awaiting === true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Verificar si está esperando que el usuario proporcione su email
   */
  static async isAwaitingEmailInput(conversationId: string): Promise<boolean> {
    try {
      const awaiting = await ContextManager.getVariable(conversationId, 'awaitingEmailInput');
      return awaiting === true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Capturar email del usuario, guardarlo y enviar código de verificación
   */
  static async captureAndSaveEmail(
    conversationId: string,
    clientId: string,
    emailInput: string
  ): Promise<{
    success: boolean;
    message: string;
    emailSaved?: boolean;
  }> {
    try {
      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const trimmedEmail = emailInput.trim().toLowerCase();
      
      if (!emailRegex.test(trimmedEmail)) {
        return {
          success: false,
          message: '❌ El formato del email no es válido. Por favor, ingresa un email válido (ejemplo: tu@email.com)'
        };
      }

      // Obtener cliente actual
      const client = await ClientModel.findById(clientId);
      if (!client) {
        return {
          success: false,
          message: 'Error: Cliente no encontrado. Por favor, contacta a la clínica.'
        };
      }

      // Verificar si ya existe otro cliente con este email
      const existingClient = await ClientModel.findByEmail(trimmedEmail);
      
      if (existingClient && existingClient.id !== clientId) {
        // Ya existe otro cliente con este email
        logger.warn(`Email ${trimmedEmail} already exists for client ${existingClient.id}, current client is ${clientId}`);
        
        // Verificar si el cliente existente tiene un teléfono real o es temporal
        const isExistingClientTemp = existingClient.phone.startsWith('web_');
        const isCurrentClientTemp = client.phone.startsWith('web_');
        
        if (isExistingClientTemp && !isCurrentClientTemp) {
          // El cliente existente es temporal, el actual es real
          // Actualizar el email del cliente actual (el real)
          await ClientModel.update(clientId, { email: trimmedEmail });
          logger.info(`Email ${this.maskEmail(trimmedEmail)} assigned to real client ${clientId} (existing was temp)`);
        } else if (!isExistingClientTemp && isCurrentClientTemp) {
          // El cliente existente es real, el actual es temporal
          // Usar el cliente existente en lugar del actual
          logger.info(`Using existing real client ${existingClient.id} instead of temp client ${clientId}`);
          
          // Actualizar el contexto para usar el cliente existente
          await ContextManager.setVariable(conversationId, 'pendingClientId', existingClient.id);
          
          // Continuar con el cliente existente
          clientId = existingClient.id;
        } else {
          // Ambos son reales o ambos son temporales
          // Usar el que tenga más reservas
          const { BookingModel } = await import('../../models/Booking');
          const existingBookings = await BookingModel.findAll({ clientId: existingClient.id, limit: 1 });
          const currentBookings = await BookingModel.findAll({ clientId: clientId, limit: 1 });
          
          if (existingBookings.bookings.length > currentBookings.bookings.length) {
            // El cliente existente tiene más reservas, usarlo
            logger.info(`Using existing client ${existingClient.id} (has more bookings)`);
            await ContextManager.setVariable(conversationId, 'pendingClientId', existingClient.id);
            clientId = existingClient.id;
          } else {
            // El cliente actual tiene más reservas o igual, mantenerlo
            await ClientModel.update(clientId, { email: trimmedEmail });
            logger.info(`Email ${this.maskEmail(trimmedEmail)} assigned to current client ${clientId}`);
          }
        }
      } else {
        // No hay conflicto, guardar email normalmente
        await ClientModel.update(clientId, { email: trimmedEmail });
        logger.info(`Email saved for client ${clientId}: ${this.maskEmail(trimmedEmail)}`);
      }

      // Limpiar flag de espera de email
      await ContextManager.setVariable(conversationId, 'awaitingEmailInput', false);

      // Obtener acción pendiente
      const pendingAction = await ContextManager.getVariable(conversationId, 'pendingAction') as string;

      // Generar código de verificación
      const verificationCode = this.generateVerificationCode();
      const verificationToken = this.generateVerificationToken();

      // Guardar código con expiración de 10 minutos (usar el clientId actualizado)
      this.verificationCodes.set(verificationToken, {
        code: verificationCode,
        clientId: clientId,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        attempts: 0
      });

      // Guardar token en contexto
      await ContextManager.setVariable(conversationId, 'verificationToken', verificationToken);

      // Enviar código por email
      const { EmailService } = await import('../EmailService');
      const emailSent = await EmailService.sendVerificationCode(
        trimmedEmail,
        verificationCode,
        client.name
      );

      // Preparar mensaje de respuesta
      let message = '✅ **Email guardado correctamente**\n\n';
      message += `📧 Email registrado: **${this.maskEmail(trimmedEmail)}**\n\n`;
      message += '🔒 **Verificación de Seguridad**\n\n';

      if (emailSent) {
        message += `Te he enviado un código de verificación de 6 dígitos a tu email.\n\n`;
        message += `Por favor, revisa tu bandeja de entrada (y carpeta de spam) y responde con el código que recibiste.\n\n`;
        message += `⏰ El código expira en 10 minutos.`;
      } else {
        // Fallback si el email no se pudo enviar
        message += `Intenté enviarte un código pero hubo un problema con el servicio de email.\n\n`;
        message += `⚠️ **CÓDIGO TEMPORAL:** ${verificationCode}\n\n`;
        message += `Por favor, responde con este código para continuar.`;
        
        logger.warn(`Failed to send verification email to ${trimmedEmail}, showing code in message`);
      }

      return {
        success: true,
        message,
        emailSaved: true
      };

    } catch (error) {
      logger.error('Error capturing and saving email:', error);
      return {
        success: false,
        message: 'Error al procesar tu email. Por favor, intenta nuevamente o contacta a la clínica.'
      };
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
   * Detectar si el mensaje parece ser un email
   */
  static isEmailMessage(message: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(message.trim());
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

import { ClientModel } from '../models/Client';
import { LoyaltyTransaction, LoyaltyStats } from '../types/loyalty';
import logger from '../utils/logger';

export class LoyaltyService {
  // Reglas de puntos por defecto
  private static readonly POINTS_PER_PESO = 1; // 1 punto por cada peso gastado
  private static readonly WELCOME_BONUS = 100; // Puntos de bienvenida
  private static readonly BIRTHDAY_BONUS = 200; // Puntos de cumpleaños
  private static readonly REFERRAL_BONUS = 500; // Puntos por referir a alguien

  static async awardPoints(
    clientId: string, 
    points: number, 
    reason: string,
    referenceId?: string,
    referenceType?: 'booking' | 'purchase' | 'manual' | 'bonus'
  ): Promise<void> {
    try {
      // Agregar puntos al cliente
      await ClientModel.addLoyaltyPoints(clientId, points);
      
      // Registrar la transacción (en una implementación completa, esto iría a una tabla de transacciones)
      logger.info(`Loyalty points awarded: ${points} points to client ${clientId} - ${reason}`);
      
      // Aquí se podría guardar en una tabla de transacciones de lealtad
      // await this.recordLoyaltyTransaction(clientId, 'earned', points, reason, referenceId, referenceType);
      
    } catch (error) {
      logger.error('Error awarding loyalty points:', error);
      throw error;
    }
  }

  static async redeemPoints(
    clientId: string, 
    points: number, 
    reason: string,
    referenceId?: string,
    referenceType?: 'booking' | 'purchase' | 'manual'
  ): Promise<void> {
    try {
      const client = await ClientModel.findById(clientId);
      if (!client) {
        throw new Error('Cliente no encontrado');
      }

      if (client.loyaltyPoints < points) {
        throw new Error('Puntos insuficientes');
      }

      // Descontar puntos del cliente
      await ClientModel.subtractLoyaltyPoints(clientId, points);
      
      // Registrar la transacción
      logger.info(`Loyalty points redeemed: ${points} points from client ${clientId} - ${reason}`);
      
      // Aquí se podría guardar en una tabla de transacciones de lealtad
      // await this.recordLoyaltyTransaction(clientId, 'redeemed', points, reason, referenceId, referenceType);
      
    } catch (error) {
      logger.error('Error redeeming loyalty points:', error);
      throw error;
    }
  }

  static async calculatePointsForPurchase(amount: number): Promise<number> {
    return Math.floor(amount * this.POINTS_PER_PESO);
  }

  static async awardWelcomeBonus(clientId: string): Promise<void> {
    await this.awardPoints(
      clientId, 
      this.WELCOME_BONUS, 
      'Bono de bienvenida',
      undefined,
      'bonus'
    );
  }

  static async awardBirthdayBonus(clientId: string): Promise<void> {
    await this.awardPoints(
      clientId, 
      this.BIRTHDAY_BONUS, 
      'Bono de cumpleaños',
      undefined,
      'bonus'
    );
  }

  static async awardReferralBonus(referrerId: string, referredId: string): Promise<void> {
    // Puntos para quien refiere
    await this.awardPoints(
      referrerId, 
      this.REFERRAL_BONUS, 
      'Bono por referir cliente',
      referredId,
      'bonus'
    );

    // Puntos para el referido
    await this.awardPoints(
      referredId, 
      this.REFERRAL_BONUS / 2, 
      'Bono por ser referido',
      referrerId,
      'bonus'
    );
  }

  static async getClientLoyaltyStats(clientId: string): Promise<LoyaltyStats> {
    const client = await ClientModel.findById(clientId);
    if (!client) {
      throw new Error('Cliente no encontrado');
    }

    // En una implementación completa, esto vendría de la tabla de transacciones
    return {
      totalPointsEarned: client.loyaltyPoints, // Simplificado
      totalPointsRedeemed: 0, // Simplificado
      currentBalance: client.loyaltyPoints,
      transactionCount: 1, // Simplificado
      lastTransaction: client.updatedAt
    };
  }

  static async getPointsValue(points: number): Promise<number> {
    // 100 puntos = 1 peso de descuento
    return points / 100;
  }

  static async canRedeemPoints(clientId: string, points: number): Promise<boolean> {
    const client = await ClientModel.findById(clientId);
    return client ? client.loyaltyPoints >= points : false;
  }

  static getLoyaltyTiers(): Array<{name: string, minPoints: number, benefits: string[]}> {
    return [
      {
        name: 'Bronce',
        minPoints: 0,
        benefits: ['Puntos por compras', 'Ofertas especiales']
      },
      {
        name: 'Plata',
        minPoints: 1000,
        benefits: ['5% descuento adicional', 'Acceso prioritario', 'Bono de cumpleaños']
      },
      {
        name: 'Oro',
        minPoints: 5000,
        benefits: ['10% descuento adicional', 'Servicios exclusivos', 'Consultas gratuitas']
      },
      {
        name: 'Platino',
        minPoints: 10000,
        benefits: ['15% descuento adicional', 'Servicios VIP', 'Atención personalizada']
      }
    ];
  }

  static getClientTier(loyaltyPoints: number): {name: string, minPoints: number, benefits: string[]} {
    const tiers = this.getLoyaltyTiers();
    
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (loyaltyPoints >= tiers[i].minPoints) {
        return tiers[i];
      }
    }
    
    return tiers[0]; // Bronce por defecto
  }
}
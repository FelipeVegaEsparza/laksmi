import { Response } from 'express';
import { LoyaltyService } from '../services/LoyaltyService';
import { AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';

export class LoyaltyController {
  static async getClientLoyaltyStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { clientId } = req.params;
      const stats = await LoyaltyService.getClientLoyaltyStats(clientId);
      
      res.json({
        success: true,
        message: 'Estadísticas de lealtad obtenidas exitosamente',
        data: stats
      });
    } catch (error: any) {
      logger.error('Get loyalty stats error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al obtener estadísticas de lealtad'
      });
    }
  }

  static async awardPoints(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { clientId } = req.params;
      const { points, reason, referenceId, referenceType } = req.body;
      
      await LoyaltyService.awardPoints(clientId, points, reason, referenceId, referenceType);
      
      res.json({
        success: true,
        message: 'Puntos otorgados exitosamente'
      });
    } catch (error: any) {
      logger.error('Award points error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al otorgar puntos'
      });
    }
  }

  static async redeemPoints(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { clientId } = req.params;
      const { points, reason, referenceId, referenceType } = req.body;
      
      await LoyaltyService.redeemPoints(clientId, points, reason, referenceId, referenceType);
      
      res.json({
        success: true,
        message: 'Puntos canjeados exitosamente'
      });
    } catch (error: any) {
      logger.error('Redeem points error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al canjear puntos'
      });
    }
  }

  static async calculatePointsForPurchase(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { amount } = req.body;
      const points = await LoyaltyService.calculatePointsForPurchase(amount);
      
      res.json({
        success: true,
        message: 'Puntos calculados exitosamente',
        data: { points, amount }
      });
    } catch (error: any) {
      logger.error('Calculate points error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al calcular puntos'
      });
    }
  }

  static async awardWelcomeBonus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { clientId } = req.params;
      await LoyaltyService.awardWelcomeBonus(clientId);
      
      res.json({
        success: true,
        message: 'Bono de bienvenida otorgado exitosamente'
      });
    } catch (error: any) {
      logger.error('Award welcome bonus error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al otorgar bono de bienvenida'
      });
    }
  }

  static async awardBirthdayBonus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { clientId } = req.params;
      await LoyaltyService.awardBirthdayBonus(clientId);
      
      res.json({
        success: true,
        message: 'Bono de cumpleaños otorgado exitosamente'
      });
    } catch (error: any) {
      logger.error('Award birthday bonus error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al otorgar bono de cumpleaños'
      });
    }
  }

  static async getLoyaltyTiers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tiers = LoyaltyService.getLoyaltyTiers();
      
      res.json({
        success: true,
        message: 'Niveles de lealtad obtenidos exitosamente',
        data: tiers
      });
    } catch (error: any) {
      logger.error('Get loyalty tiers error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener niveles de lealtad'
      });
    }
  }

  static async getClientTier(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { clientId } = req.params;
      const stats = await LoyaltyService.getClientLoyaltyStats(clientId);
      const tier = LoyaltyService.getClientTier(stats.currentBalance);
      
      res.json({
        success: true,
        message: 'Nivel del cliente obtenido exitosamente',
        data: {
          currentTier: tier,
          currentPoints: stats.currentBalance,
          nextTier: LoyaltyService.getLoyaltyTiers().find(t => t.minPoints > stats.currentBalance)
        }
      });
    } catch (error: any) {
      logger.error('Get client tier error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al obtener nivel del cliente'
      });
    }
  }

  static async getPointsValue(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { points } = req.params;
      const value = await LoyaltyService.getPointsValue(parseInt(points));
      
      res.json({
        success: true,
        message: 'Valor de puntos calculado exitosamente',
        data: { points: parseInt(points), value }
      });
    } catch (error: any) {
      logger.error('Get points value error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al calcular valor de puntos'
      });
    }
  }
}
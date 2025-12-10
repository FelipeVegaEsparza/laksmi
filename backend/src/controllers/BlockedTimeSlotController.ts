import { Response } from 'express';
import { BlockedTimeSlotModel, CreateBlockedTimeSlotRequest } from '../models/BlockedTimeSlot';
import { AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';

export class BlockedTimeSlotController {
  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { startTime, endTime, reason } = req.body;

      if (!startTime || !endTime) {
        res.status(400).json({
          success: false,
          error: 'startTime y endTime son requeridos'
        });
        return;
      }

      const start = new Date(startTime);
      const end = new Date(endTime);

      if (start >= end) {
        res.status(400).json({
          success: false,
          error: 'La hora de inicio debe ser anterior a la hora de fin'
        });
        return;
      }

      const data: CreateBlockedTimeSlotRequest = {
        startTime: start,
        endTime: end,
        reason,
        createdBy: req.user?.userId
      };

      const slot = await BlockedTimeSlotModel.create(data);

      res.status(201).json({
        success: true,
        message: 'Bloque horario bloqueado exitosamente',
        data: slot
      });
    } catch (error: any) {
      logger.error('Create blocked time slot error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al bloquear horario'
      });
    }
  }

  static async getAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const slots = await BlockedTimeSlotModel.findAll();

      res.json({
        success: true,
        data: slots
      });
    } catch (error: any) {
      logger.error('Get blocked time slots error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener bloques bloqueados'
      });
    }
  }

  static async getByDateRange(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          error: 'startDate y endDate son requeridos'
        });
        return;
      }

      const slots = await BlockedTimeSlotModel.findByDateRange(
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json({
        success: true,
        data: slots
      });
    } catch (error: any) {
      logger.error('Get blocked time slots by date range error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener bloques bloqueados'
      });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const deleted = await BlockedTimeSlotModel.delete(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Bloque bloqueado no encontrado'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Bloque desbloqueado exitosamente'
      });
    } catch (error: any) {
      logger.error('Delete blocked time slot error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al desbloquear horario'
      });
    }
  }
}

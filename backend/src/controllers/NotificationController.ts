import { Request, Response } from 'express';
import { NotificationService } from '../services/NotificationService';
import { CreateNotificationRequest, UpdateNotificationRequest, NotificationFilters } from '../types/notification';
import { AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';

export class NotificationController {
  // Gestión de notificaciones
  static async createNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const notificationData: CreateNotificationRequest = req.body;
      
      // Convertir scheduledFor string a Date object
      if (typeof notificationData.scheduledFor === 'string') {
        notificationData.scheduledFor = new Date(notificationData.scheduledFor);
      }

      const notification = await NotificationService.createNotification(notificationData);
      
      res.status(201).json({
        success: true,
        message: 'Notificación programada exitosamente',
        data: notification
      });
    } catch (error: any) {
      logger.error('Create notification error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al programar notificación'
      });
    }
  }

  static async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const filters: NotificationFilters = {
        clientId: req.query.clientId as string,
        bookingId: req.query.bookingId as string,
        type: req.query.type as any,
        channel: req.query.channel as any,
        status: req.query.status as any,
        scheduledFrom: req.query.scheduledFrom ? new Date(req.query.scheduledFrom as string) : undefined,
        scheduledTo: req.query.scheduledTo ? new Date(req.query.scheduledTo as string) : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10
      };

      const result = await NotificationService.getNotifications(filters);
      
      res.json({
        success: true,
        message: 'Notificaciones obtenidas exitosamente',
        data: result
      });
    } catch (error: any) {
      logger.error('Get notifications error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener notificaciones'
      });
    }
  }

  static async getNotificationById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const notification = await NotificationService.getNotification(id);
      
      res.json({
        success: true,
        message: 'Notificación obtenida exitosamente',
        data: notification
      });
    } catch (error: any) {
      const statusCode = error.message === 'Notificación no encontrada' ? 404 : 500;
      logger.error('Get notification by ID error:', error);
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Error al obtener notificación'
      });
    }
  }

  static async updateNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates: UpdateNotificationRequest = req.body;
      
      // Convertir scheduledFor string a Date object si está presente
      if (updates.scheduledFor && typeof updates.scheduledFor === 'string') {
        updates.scheduledFor = new Date(updates.scheduledFor);
      }

      const notification = await NotificationService.updateNotification(id, updates);
      
      res.json({
        success: true,
        message: 'Notificación actualizada exitosamente',
        data: notification
      });
    } catch (error: any) {
      const statusCode = error.message === 'Notificación no encontrada' ? 404 : 400;
      logger.error('Update notification error:', error);
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Error al actualizar notificación'
      });
    }
  }

  static async cancelNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const notification = await NotificationService.cancelNotification(id);
      
      res.json({
        success: true,
        message: 'Notificación cancelada exitosamente',
        data: notification
      });
    } catch (error: any) {
      const statusCode = error.message === 'Notificación no encontrada' ? 404 : 400;
      logger.error('Cancel notification error:', error);
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Error al cancelar notificación'
      });
    }
  }

  static async getNotificationStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;
      
      const stats = await NotificationService.getNotificationStats(dateFrom, dateTo);
      
      res.json({
        success: true,
        message: 'Estadísticas de notificaciones obtenidas exitosamente',
        data: stats
      });
    } catch (error: any) {
      logger.error('Get notification stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener estadísticas'
      });
    }
  }

  // Gestión de recordatorios de citas
  static async scheduleAppointmentReminder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      const config = req.body.config || {};
      
      const notifications = await NotificationService.scheduleAppointmentReminder(bookingId, config);
      
      res.json({
        success: true,
        message: 'Recordatorios programados exitosamente',
        data: notifications
      });
    } catch (error: any) {
      const statusCode = error.message === 'Cita no encontrada' ? 404 : 400;
      logger.error('Schedule appointment reminder error:', error);
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Error al programar recordatorios'
      });
    }
  }

  static async scheduleAppointmentConfirmation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      
      const notification = await NotificationService.scheduleAppointmentConfirmation(bookingId);
      
      res.json({
        success: true,
        message: 'Confirmación programada exitosamente',
        data: notification
      });
    } catch (error: any) {
      const statusCode = error.message === 'Cita no encontrada' ? 404 : 400;
      logger.error('Schedule appointment confirmation error:', error);
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Error al programar confirmación'
      });
    }
  }

  static async scheduleFollowUp(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      const { hoursAfter } = req.body;
      
      const notification = await NotificationService.scheduleFollowUp(bookingId, hoursAfter);
      
      res.json({
        success: true,
        message: 'Seguimiento programado exitosamente',
        data: notification
      });
    } catch (error: any) {
      const statusCode = error.message === 'Cita no encontrada' ? 404 : 400;
      logger.error('Schedule follow-up error:', error);
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Error al programar seguimiento'
      });
    }
  }

  static async cancelBookingNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      
      await NotificationService.cancelBookingNotifications(bookingId);
      
      res.json({
        success: true,
        message: 'Notificaciones de la cita canceladas exitosamente'
      });
    } catch (error: any) {
      logger.error('Cancel booking notifications error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al cancelar notificaciones'
      });
    }
  }

  // Procesamiento manual de notificaciones
  static async processPendingNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await NotificationService.processPendingNotifications();
      
      res.json({
        success: true,
        message: 'Notificaciones pendientes procesadas exitosamente'
      });
    } catch (error: any) {
      logger.error('Process pending notifications error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al procesar notificaciones'
      });
    }
  }

  // Gestión de plantillas
  static async getTemplates(req: Request, res: Response): Promise<void> {
    try {
      const type = req.query.type as any;
      const channel = req.query.channel as any;
      
      let templates;
      if (type) {
        templates = NotificationService.getTemplatesByType(type);
      } else if (channel) {
        templates = NotificationService.getTemplatesByChannel(channel);
      } else {
        templates = NotificationService.getAllTemplates();
      }
      
      res.json({
        success: true,
        message: 'Plantillas obtenidas exitosamente',
        data: templates
      });
    } catch (error: any) {
      logger.error('Get templates error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener plantillas'
      });
    }
  }

  static async getTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { templateName } = req.params;
      const template = NotificationService.getTemplate(templateName);
      
      if (!template) {
        res.status(404).json({
          success: false,
          error: 'Plantilla no encontrada'
        });
        return;
      }
      
      res.json({
        success: true,
        message: 'Plantilla obtenida exitosamente',
        data: template
      });
    } catch (error: any) {
      logger.error('Get template error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener plantilla'
      });
    }
  }
}
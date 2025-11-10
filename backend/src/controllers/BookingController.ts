import { Request, Response } from 'express';
import { BookingService } from '../services/BookingService';
import { CreateBookingRequest, UpdateBookingRequest, BookingFilters, AvailabilityRequest, CreateProfessionalRequest, UpdateProfessionalRequest } from '../types/booking';
import { AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';

export class BookingController {
  // Gestión de Citas
  static async createBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const bookingData: CreateBookingRequest = req.body;
      
      // Convertir dateTime string a Date object
      if (typeof bookingData.dateTime === 'string') {
        bookingData.dateTime = new Date(bookingData.dateTime);
      }

      const booking = await BookingService.createBooking(bookingData);
      
      res.status(201).json({
        success: true,
        message: 'Cita creada exitosamente',
        data: booking
      });
    } catch (error: any) {
      logger.error('Create booking error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al crear cita'
      });
    }
  }

  static async getBookings(req: Request, res: Response): Promise<void> {
    try {
      const filters: BookingFilters = {
        clientId: req.query.clientId as string,
        professionalId: req.query.professionalId as string,
        serviceId: req.query.serviceId as string,
        status: req.query.status as any,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10
      };

      const result = await BookingService.getBookings(filters);
      
      res.json({
        success: true,
        message: 'Citas obtenidas exitosamente',
        data: result
      });
    } catch (error: any) {
      logger.error('Get bookings error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener citas'
      });
    }
  }

  static async getBookingById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const booking = await BookingService.getBookingById(id);
      
      res.json({
        success: true,
        message: 'Cita obtenida exitosamente',
        data: booking
      });
    } catch (error: any) {
      const statusCode = error.message === 'Cita no encontrada' ? 404 : 500;
      logger.error('Get booking by ID error:', error);
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Error al obtener cita'
      });
    }
  }

  static async updateBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates: UpdateBookingRequest = req.body;
      
      // Convertir dateTime string a Date object si está presente
      if (updates.dateTime && typeof updates.dateTime === 'string') {
        updates.dateTime = new Date(updates.dateTime);
      }

      const booking = await BookingService.updateBooking(id, updates);
      
      res.json({
        success: true,
        message: 'Cita actualizada exitosamente',
        data: booking
      });
    } catch (error: any) {
      const statusCode = error.message === 'Cita no encontrada' ? 404 : 400;
      logger.error('Update booking error:', error);
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Error al actualizar cita'
      });
    }
  }

  static async cancelBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      const booking = await BookingService.cancelBooking(id, reason);
      
      res.json({
        success: true,
        message: 'Cita cancelada exitosamente',
        data: booking
      });
    } catch (error: any) {
      const statusCode = error.message === 'Cita no encontrada' ? 404 : 400;
      logger.error('Cancel booking error:', error);
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Error al cancelar cita'
      });
    }
  }

  static async getAvailability(req: Request, res: Response): Promise<void> {
    try {
      const availabilityRequest: AvailabilityRequest = {
        serviceId: req.query.serviceId as string,
        dateFrom: new Date(req.query.dateFrom as string),
        dateTo: new Date(req.query.dateTo as string),
        preferredProfessionalId: req.query.preferredProfessionalId as string
      };

      if (!availabilityRequest.serviceId || !availabilityRequest.dateFrom || !availabilityRequest.dateTo) {
        res.status(400).json({
          success: false,
          error: 'serviceId, dateFrom y dateTo son requeridos'
        });
        return;
      }

      const availability = await BookingService.getAvailability(availabilityRequest);
      
      res.json({
        success: true,
        message: 'Disponibilidad obtenida exitosamente',
        data: availability
      });
    } catch (error: any) {
      logger.error('Get availability error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al obtener disponibilidad'
      });
    }
  }

  static async getClientBookings(req: Request, res: Response): Promise<void> {
    try {
      const { clientId } = req.params;
      const includeHistory = req.query.includeHistory === 'true';
      
      const bookings = await BookingService.getClientBookings(clientId, includeHistory);
      
      res.json({
        success: true,
        message: 'Historial de citas obtenido exitosamente',
        data: bookings
      });
    } catch (error: any) {
      logger.error('Get client bookings error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener historial de citas'
      });
    }
  }

  static async getBookingStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;
      
      const stats = await BookingService.getBookingStats(dateFrom, dateTo);
      
      res.json({
        success: true,
        message: 'Estadísticas de citas obtenidas exitosamente',
        data: stats
      });
    } catch (error: any) {
      logger.error('Get booking stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener estadísticas'
      });
    }
  }

  static async getTodayBookings(req: Request, res: Response): Promise<void> {
    try {
      const bookings = await BookingService.getTodayBookings();
      
      res.json({
        success: true,
        message: 'Citas de hoy obtenidas exitosamente',
        data: bookings
      });
    } catch (error: any) {
      logger.error('Get today bookings error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener citas de hoy'
      });
    }
  }

  static async getUpcomingBookings(req: Request, res: Response): Promise<void> {
    try {
      const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;
      const bookings = await BookingService.getUpcomingBookings(hours);
      
      res.json({
        success: true,
        message: 'Próximas citas obtenidas exitosamente',
        data: bookings
      });
    } catch (error: any) {
      logger.error('Get upcoming bookings error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener próximas citas'
      });
    }
  }

  static async markCompleted(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      
      const booking = await BookingService.markBookingCompleted(id, notes);
      
      res.json({
        success: true,
        message: 'Cita marcada como completada',
        data: booking
      });
    } catch (error: any) {
      const statusCode = error.message === 'Cita no encontrada' ? 404 : 400;
      logger.error('Mark booking completed error:', error);
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Error al completar cita'
      });
    }
  }

  static async markNoShow(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const booking = await BookingService.markBookingNoShow(id);
      
      res.json({
        success: true,
        message: 'Cita marcada como no show',
        data: booking
      });
    } catch (error: any) {
      const statusCode = error.message === 'Cita no encontrada' ? 404 : 400;
      logger.error('Mark booking no show error:', error);
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Error al marcar cita como no show'
      });
    }
  }

  // Gestión de Profesionales
  static async createProfessional(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const professionalData: CreateProfessionalRequest = req.body;
      const professional = await BookingService.createProfessional(professionalData);
      
      res.status(201).json({
        success: true,
        message: 'Profesional creado exitosamente',
        data: professional
      });
    } catch (error: any) {
      logger.error('Create professional error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al crear profesional'
      });
    }
  }

  static async getProfessionals(req: Request, res: Response): Promise<void> {
    try {
      const activeOnly = req.query.activeOnly === 'true';
      const professionals = await BookingService.getProfessionals(activeOnly);
      
      res.json({
        success: true,
        message: 'Profesionales obtenidos exitosamente',
        data: professionals
      });
    } catch (error: any) {
      logger.error('Get professionals error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener profesionales'
      });
    }
  }

  static async getProfessionalById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const professional = await BookingService.getProfessional(id);
      
      res.json({
        success: true,
        message: 'Profesional obtenido exitosamente',
        data: professional
      });
    } catch (error: any) {
      const statusCode = error.message === 'Profesional no encontrado' ? 404 : 500;
      logger.error('Get professional by ID error:', error);
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Error al obtener profesional'
      });
    }
  }

  static async updateProfessional(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates: UpdateProfessionalRequest = req.body;
      
      const professional = await BookingService.updateProfessional(id, updates);
      
      res.json({
        success: true,
        message: 'Profesional actualizado exitosamente',
        data: professional
      });
    } catch (error: any) {
      const statusCode = error.message === 'Profesional no encontrado' ? 404 : 400;
      logger.error('Update professional error:', error);
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Error al actualizar profesional'
      });
    }
  }

  static async deleteProfessional(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await BookingService.deleteProfessional(id);
      
      res.json({
        success: true,
        message: 'Profesional eliminado exitosamente'
      });
    } catch (error: any) {
      const statusCode = error.message === 'Profesional no encontrado' ? 404 : 400;
      logger.error('Delete professional error:', error);
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Error al eliminar profesional'
      });
    }
  }

  static async toggleProfessionalStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const professional = await BookingService.toggleProfessionalStatus(id);
      
      res.json({
        success: true,
        message: `Profesional ${professional.isActive ? 'activado' : 'desactivado'} exitosamente`,
        data: professional
      });
    } catch (error: any) {
      const statusCode = error.message === 'Profesional no encontrado' ? 404 : 400;
      logger.error('Toggle professional status error:', error);
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Error al cambiar estado del profesional'
      });
    }
  }

  static async getProfessionalsByService(req: Request, res: Response): Promise<void> {
    try {
      const { serviceId } = req.params;
      const professionals = await BookingService.getProfessionalsByService(serviceId);
      
      res.json({
        success: true,
        message: 'Profesionales por servicio obtenidos exitosamente',
        data: professionals
      });
    } catch (error: any) {
      const statusCode = error.message === 'Servicio no encontrado' ? 404 : 500;
      logger.error('Get professionals by service error:', error);
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Error al obtener profesionales por servicio'
      });
    }
  }
}
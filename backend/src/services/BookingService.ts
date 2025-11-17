import { BookingModel } from '../models/Booking';
import { ProfessionalModel } from '../models/Professional';
import { ServiceModel } from '../models/Service';
import { ClientModel } from '../models/Client';
import { NotificationService } from './NotificationService';
import { 
  Booking, 
  CreateBookingRequest, 
  UpdateBookingRequest, 
  BookingFilters, 
  AvailabilityRequest, 
  AvailabilityResponse,
  Professional,
  CreateProfessionalRequest,
  UpdateProfessionalRequest,
  BookingStats
} from '../types/booking';
import logger from '../utils/logger';

export class BookingService {
  // Gestión de Citas
  static async createBooking(bookingData: CreateBookingRequest): Promise<Booking> {
    // Validar que el cliente existe
    const client = await ClientModel.findById(bookingData.clientId);
    if (!client) {
      throw new Error('Cliente no encontrado');
    }

    // Validar que el servicio existe y está activo
    const service = await ServiceModel.findById(bookingData.serviceId);
    if (!service) {
      throw new Error('Servicio no encontrado');
    }

    if (!service.isActive) {
      throw new Error('El servicio no está disponible actualmente');
    }

    // Validar fecha mínima (no permitir citas con menos de 1 hora de anticipación)
    const minBookingTime = new Date();
    minBookingTime.setHours(minBookingTime.getHours() + 1);
    
    if (bookingData.dateTime < minBookingTime) {
      throw new Error('Las citas deben reservarse con al menos 1 hora de anticipación');
    }

    const booking = await BookingModel.create(bookingData);
    logger.info(`New booking created: ${booking.id} for client ${booking.clientId}`);
    
    // Programar notificaciones automáticamente
    try {
      // Confirmación inmediata
      await NotificationService.scheduleAppointmentConfirmation(booking.id);
      
      // Recordatorio 24h antes
      await NotificationService.scheduleAppointmentReminder(booking.id);
      
      logger.info(`Notifications scheduled for booking ${booking.id}`);
    } catch (error) {
      logger.error(`Error scheduling notifications for booking ${booking.id}:`, error);
      // No fallar la creación de la cita por errores de notificación
    }

    // Enviar email de confirmación
    logger.info(`📧 Starting email confirmation process for booking ${booking.id}`);
    try {
      logger.info(`📧 Importing EmailService...`);
      const { EmailService } = await import('./EmailService');
      logger.info(`📧 EmailService imported successfully`);
      const { ProfessionalModel } = await import('../models/Professional');
      
      let professionalName: string | undefined;
      if (booking.professionalId) {
        const professional = await ProfessionalModel.findById(booking.professionalId);
        professionalName = professional?.name;
      }

      if (client.email) {
        logger.info(`Attempting to send confirmation email to ${client.email} for booking ${booking.id}, status: ${booking.status}`);
        
        const emailSent = await EmailService.sendBookingConfirmation(client.email, {
          clientName: client.name,
          serviceName: service.name,
          date: booking.dateTime,
          duration: service.duration,
          price: service.price,
          professionalName,
          notes: booking.notes,
          status: booking.status,
          paymentAmount: booking.paymentAmount,
          bookingId: booking.id
        });

        if (emailSent) {
          logger.info(`Confirmation email sent successfully for booking ${booking.id}`);
        } else {
          logger.warn(`Confirmation email failed to send for booking ${booking.id}`);
        }
      } else {
        logger.warn(`No email address for client ${client.id}, skipping confirmation email`);
      }
    } catch (error) {
      logger.error(`Error sending confirmation email for booking ${booking.id}:`, error);
      // No fallar la creación por error de email
    }
    
    logger.info(`✅ Booking created successfully: ${booking.id}, returning to controller`);
    return booking;
  }

  static async getBookingById(id: string): Promise<Booking> {
    const booking = await BookingModel.findById(id);
    if (!booking) {
      throw new Error('Cita no encontrada');
    }
    return booking;
  }

  static async updateBooking(id: string, updates: UpdateBookingRequest): Promise<Booking> {
    const existingBooking = await BookingModel.findById(id);
    if (!existingBooking) {
      throw new Error('Cita no encontrada');
    }

    // No permitir modificar citas pasadas
    if (existingBooking.dateTime < new Date() && updates.dateTime) {
      throw new Error('No se pueden modificar citas pasadas');
    }

    // No permitir modificar citas canceladas o completadas a menos que sea para cambiar el estado
    if ((existingBooking.status === 'cancelled' || existingBooking.status === 'completed') && 
        (updates.dateTime || updates.professionalId)) {
      throw new Error('No se pueden modificar citas canceladas o completadas');
    }

    const updatedBooking = await BookingModel.update(id, updates);
    if (!updatedBooking) {
      throw new Error('Error al actualizar la cita');
    }

    // Si el estado cambió de pending_payment a confirmed, enviar correo de confirmación
    if (existingBooking.status === 'pending_payment' && updates.status === 'confirmed') {
      try {
        const { EmailService } = await import('./EmailService');
        const client = await ClientModel.findById(existingBooking.clientId);
        const service = await ServiceModel.findById(existingBooking.serviceId);
        const professional = existingBooking.professionalId 
          ? await ProfessionalModel.findById(existingBooking.professionalId)
          : null;

        if (client && client.email && service) {
          await EmailService.sendBookingConfirmation(client.email, {
            clientName: client.name,
            serviceName: service.name,
            date: updatedBooking.dateTime,
            duration: updatedBooking.duration,
            price: updatedBooking.paymentAmount,
            professionalName: professional?.name,
            notes: updatedBooking.notes,
            status: 'confirmed',
            paymentAmount: updatedBooking.paymentAmount,
            bookingId: updatedBooking.id
          });

          logger.info(`Payment confirmation email sent for booking ${id}`);
        }
      } catch (error) {
        logger.error(`Error sending payment confirmation email for booking ${id}:`, error);
        // No fallar la actualización por error de email
      }
    }

    logger.info(`Booking updated: ${updatedBooking.id} - Status: ${updatedBooking.status}`);
    return updatedBooking;
  }

  static async cancelBooking(id: string, reason?: string): Promise<Booking> {
    const booking = await BookingModel.findById(id);
    if (!booking) {
      throw new Error('Cita no encontrada');
    }

    if (booking.status === 'cancelled') {
      throw new Error('La cita ya está cancelada');
    }

    if (booking.status === 'completed') {
      throw new Error('No se puede cancelar una cita completada');
    }

    // Validar tiempo mínimo para cancelación (ej: 2 horas antes)
    const minCancelTime = new Date(booking.dateTime);
    minCancelTime.setHours(minCancelTime.getHours() - 2);
    
    if (new Date() > minCancelTime) {
      throw new Error('Las citas solo pueden cancelarse con al menos 2 horas de anticipación');
    }

    const cancelledBooking = await BookingModel.update(id, {
      status: 'cancelled',
      notes: reason ? `Cancelada: ${reason}` : 'Cancelada'
    });

    if (!cancelledBooking) {
      throw new Error('Error al cancelar la cita');
    }

    // Cancelar notificaciones pendientes
    try {
      await NotificationService.cancelBookingNotifications(id);
      logger.info(`Cancelled notifications for booking ${id}`);
    } catch (error) {
      logger.error(`Error cancelling notifications for booking ${id}:`, error);
    }

    // Enviar email de cancelación
    try {
      const { EmailService } = await import('./EmailService');
      const client = await ClientModel.findById(booking.clientId);
      const service = await ServiceModel.findById(booking.serviceId);

      if (client && client.email && service) {
        await EmailService.sendBookingCancellation(client.email, {
          clientName: client.name,
          serviceName: service.name,
          date: booking.dateTime,
          reason
        });

        logger.info(`Cancellation email sent for booking ${id}`);
      }
    } catch (error) {
      logger.error(`Error sending cancellation email for booking ${id}:`, error);
      // No fallar la cancelación por error de email
    }

    logger.info(`Booking cancelled: ${cancelledBooking.id} - Reason: ${reason || 'No reason provided'}`);
    return cancelledBooking;
  }

  static async getBookings(filters: BookingFilters = {}): Promise<{ bookings: Booking[]; total: number; page: number; totalPages: number }> {
    const { page = 1, limit = 10 } = filters;
    const result = await BookingModel.findAll(filters);
    
    return {
      ...result,
      page,
      totalPages: Math.ceil(result.total / limit)
    };
  }

  static async getClientBookings(clientId: string, includeHistory: boolean = true): Promise<Booking[]> {
    const filters: BookingFilters = { clientId };
    
    if (!includeHistory) {
      filters.dateFrom = new Date();
    }

    const { bookings } = await BookingModel.findAll(filters);
    return bookings;
  }

  static async getAvailability(request: AvailabilityRequest): Promise<AvailabilityResponse> {
    // Validar que el servicio existe
    const service = await ServiceModel.findById(request.serviceId);
    if (!service) {
      throw new Error('Servicio no encontrado');
    }

    if (!service.isActive) {
      throw new Error('El servicio no está disponible actualmente');
    }

    // Validar rango de fechas
    if (request.dateFrom >= request.dateTo) {
      throw new Error('La fecha de inicio debe ser anterior a la fecha de fin');
    }

    // Limitar consulta a máximo 30 días
    const maxDays = 30;
    const daysDiff = Math.ceil((request.dateTo.getTime() - request.dateFrom.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > maxDays) {
      throw new Error(`La consulta de disponibilidad está limitada a ${maxDays} días`);
    }

    return await BookingModel.getAvailability(request);
  }

  static async getBookingStats(dateFrom?: Date, dateTo?: Date): Promise<BookingStats> {
    return await BookingModel.getBookingStats(dateFrom, dateTo);
  }

  // Gestión de Profesionales
  static async createProfessional(professionalData: CreateProfessionalRequest): Promise<Professional> {
    // Validar que el nombre no esté duplicado
    const existingProfessional = await ProfessionalModel.findByName(professionalData.name);
    if (existingProfessional) {
      throw new Error('Ya existe un profesional con ese nombre');
    }

    // Validar que los servicios en specialties existen
    for (const serviceId of professionalData.specialties) {
      const service = await ServiceModel.findById(serviceId);
      if (!service) {
        throw new Error(`Servicio no encontrado: ${serviceId}`);
      }
    }

    const professional = await ProfessionalModel.create(professionalData);
    logger.info(`New professional created: ${professional.name}`);
    
    return professional;
  }

  static async updateProfessional(id: string, updates: UpdateProfessionalRequest): Promise<Professional> {
    const existingProfessional = await ProfessionalModel.findById(id);
    if (!existingProfessional) {
      throw new Error('Profesional no encontrado');
    }

    // Validar nombre único si se está actualizando
    if (updates.name && updates.name !== existingProfessional.name) {
      const duplicateProfessional = await ProfessionalModel.findByName(updates.name);
      if (duplicateProfessional) {
        throw new Error('Ya existe un profesional con ese nombre');
      }
    }

    // Validar servicios si se están actualizando
    if (updates.specialties) {
      for (const serviceId of updates.specialties) {
        const service = await ServiceModel.findById(serviceId);
        if (!service) {
          throw new Error(`Servicio no encontrado: ${serviceId}`);
        }
      }
    }

    const updatedProfessional = await ProfessionalModel.update(id, updates);
    if (!updatedProfessional) {
      throw new Error('Error al actualizar el profesional');
    }

    logger.info(`Professional updated: ${updatedProfessional.name}`);
    return updatedProfessional;
  }

  static async getProfessional(id: string): Promise<Professional> {
    const professional = await ProfessionalModel.findById(id);
    if (!professional) {
      throw new Error('Profesional no encontrado');
    }
    return professional;
  }

  static async getProfessionals(activeOnly: boolean = false): Promise<Professional[]> {
    return await ProfessionalModel.findAll(activeOnly);
  }

  static async deleteProfessional(id: string): Promise<void> {
    const professional = await ProfessionalModel.findById(id);
    if (!professional) {
      throw new Error('Profesional no encontrado');
    }

    // Verificar que no tenga citas futuras confirmadas
    const { bookings } = await BookingModel.findAll({
      professionalId: id,
      status: 'confirmed',
      dateFrom: new Date()
    });

    if (bookings.length > 0) {
      throw new Error('No se puede eliminar un profesional con citas futuras confirmadas');
    }

    const deleted = await ProfessionalModel.delete(id);
    if (!deleted) {
      throw new Error('Error al eliminar el profesional');
    }

    logger.info(`Professional deleted: ${professional.name}`);
  }

  static async toggleProfessionalStatus(id: string): Promise<Professional> {
    const professional = await ProfessionalModel.findById(id);
    if (!professional) {
      throw new Error('Profesional no encontrado');
    }

    const updatedProfessional = await ProfessionalModel.toggleActive(id);
    if (!updatedProfessional) {
      throw new Error('Error al cambiar el estado del profesional');
    }

    const status = updatedProfessional.isActive ? 'activated' : 'deactivated';
    logger.info(`Professional ${status}: ${updatedProfessional.name}`);
    
    return updatedProfessional;
  }

  static async getProfessionalsByService(serviceId: string): Promise<Professional[]> {
    const service = await ServiceModel.findById(serviceId);
    if (!service) {
      throw new Error('Servicio no encontrado');
    }

    return await ProfessionalModel.findBySpecialty(serviceId);
  }

  // Métodos de utilidad
  static async getUpcomingBookings(hours: number = 24): Promise<Booking[]> {
    const now = new Date();
    const futureTime = new Date(now.getTime() + hours * 60 * 60 * 1000);

    const { bookings } = await BookingModel.findAll({
      status: 'confirmed',
      dateFrom: now,
      dateTo: futureTime
    });

    return bookings;
  }

  static async getTodayBookings(): Promise<Booking[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { bookings } = await BookingModel.findAll({
      dateFrom: today,
      dateTo: tomorrow
    });

    return bookings;
  }

  static async markBookingCompleted(id: string, notes?: string): Promise<Booking> {
    const booking = await BookingModel.findById(id);
    if (!booking) {
      throw new Error('Cita no encontrada');
    }

    if (booking.status !== 'confirmed') {
      throw new Error('Solo se pueden completar citas confirmadas');
    }

    // Verificar que la cita ya haya pasado
    if (booking.dateTime > new Date()) {
      throw new Error('No se puede completar una cita futura');
    }

    const completedBooking = await BookingModel.update(id, {
      status: 'completed',
      notes: notes || booking.notes
    });

    if (!completedBooking) {
      throw new Error('Error al completar la cita');
    }

    // Programar seguimiento automático
    try {
      await NotificationService.scheduleFollowUp(id, 24);
      logger.info(`Follow-up scheduled for completed booking ${id}`);
    } catch (error) {
      logger.error(`Error scheduling follow-up for booking ${id}:`, error);
    }

    logger.info(`Booking completed: ${completedBooking.id}`);
    return completedBooking;
  }

  static async markBookingNoShow(id: string): Promise<Booking> {
    const booking = await BookingModel.findById(id);
    if (!booking) {
      throw new Error('Cita no encontrada');
    }

    if (booking.status !== 'confirmed') {
      throw new Error('Solo se pueden marcar como no show citas confirmadas');
    }

    // Verificar que la cita ya haya pasado
    if (booking.dateTime > new Date()) {
      throw new Error('No se puede marcar como no show una cita futura');
    }

    const noShowBooking = await BookingModel.update(id, {
      status: 'no_show'
    });

    if (!noShowBooking) {
      throw new Error('Error al marcar la cita como no show');
    }

    logger.info(`Booking marked as no show: ${noShowBooking.id}`);
    return noShowBooking;
  }

  static async deleteBooking(id: string): Promise<boolean> {
    const booking = await BookingModel.findById(id);
    if (!booking) {
      throw new Error('Cita no encontrada');
    }

    // Cancelar notificaciones pendientes antes de eliminar
    try {
      await NotificationService.cancelBookingNotifications(id);
      logger.info(`Cancelled notifications for booking ${id} before deletion`);
    } catch (error) {
      logger.error(`Error cancelling notifications for booking ${id}:`, error);
      // Continuar con la eliminación aunque falle la cancelación de notificaciones
    }

    const deleted = await BookingModel.delete(id);
    
    if (deleted) {
      logger.info(`Booking deleted: ${id}`);
    }
    
    return deleted;
  }
}
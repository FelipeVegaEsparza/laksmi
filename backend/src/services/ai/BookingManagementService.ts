import { BookingService } from '../BookingService';
import { BookingModel } from '../../models/Booking';
import { ClientModel } from '../../models/Client';
import logger from '../../utils/logger';

export interface BookingManagementResult {
  success: boolean;
  message: string;
  booking?: any;
  availableActions?: string[];
}

export class BookingManagementService {
  /**
   * Obtener reservas activas de un cliente con información completa
   */
  static async getClientActiveBookings(clientId: string): Promise<any[]> {
    try {
      // Obtener reservas confirmadas
      const confirmedResult = await BookingModel.findAll({
        clientId,
        status: 'confirmed',
        limit: 10
      });

      // Obtener reservas canceladas y completadas para filtrar
      const allStatuses = await BookingModel.findAll({
        clientId,
        limit: 10
      });

      // Combinar y filtrar solo futuras y no canceladas/completadas
      const now = new Date();
      const bookings = allStatuses.bookings.filter(booking => 
        new Date(booking.dateTime) > now &&
        booking.status !== 'cancelled' &&
        booking.status !== 'completed'
      );

      // Enriquecer con información de servicio
      const { ServiceModel } = await import('../../models/Service');
      const enrichedBookings = await Promise.all(
        bookings.map(async (booking) => {
          const service = await ServiceModel.findById(booking.serviceId);
          return {
            ...booking,
            serviceName: service?.name || 'Servicio desconocido',
            price: service?.price || 0,
            serviceDescription: service?.description
          };
        })
      );

      return enrichedBookings;
    } catch (error) {
      logger.error('Error getting client bookings:', error);
      return [];
    }
  }

  /**
   * Confirmar una reserva
   */
  static async confirmBooking(bookingId: string, clientId: string): Promise<BookingManagementResult> {
    try {
      const booking = await BookingModel.findById(bookingId);

      if (!booking) {
        return {
          success: false,
          message: 'No encontré esa reserva. ¿Podrías verificar el número de reserva?'
        };
      }

      if (booking.clientId !== clientId) {
        return {
          success: false,
          message: 'Esta reserva no pertenece a tu cuenta.'
        };
      }

      if (booking.status === 'confirmed') {
        return {
          success: true,
          message: '✅ Tu reserva ya estaba confirmada anteriormente.',
          booking
        };
      }

      if (booking.status === 'cancelled') {
        return {
          success: false,
          message: 'Esta reserva fue cancelada. ¿Te gustaría hacer una nueva reserva?'
        };
      }

      if (booking.status === 'completed') {
        return {
          success: false,
          message: 'Esta reserva ya fue completada.'
        };
      }

      // Confirmar la reserva
      const updatedBooking = await BookingService.updateBooking(bookingId, {
        status: 'confirmed'
      });

      const dateStr = new Date(updatedBooking.dateTime).toLocaleString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Obtener nombre del servicio
      const { ServiceModel } = await import('../../models/Service');
      const service = await ServiceModel.findById(updatedBooking.serviceId);
      const serviceName = service?.name || 'tu servicio';

      return {
        success: true,
        message: `✅ ¡Perfecto! Tu reserva ha sido confirmada.\n\n📅 ${dateStr}\n💆 ${serviceName}\n\nTe enviaremos un recordatorio 24 horas antes.`,
        booking: updatedBooking,
        availableActions: ['cancelar', 'reagendar']
      };
    } catch (error: any) {
      logger.error('Error confirming booking:', error);
      return {
        success: false,
        message: `Hubo un problema al confirmar tu reserva: ${error.message}`
      };
    }
  }

  /**
   * Cancelar una reserva
   */
  static async cancelBooking(
    bookingId: string,
    clientId: string,
    reason?: string
  ): Promise<BookingManagementResult> {
    try {
      const booking = await BookingModel.findById(bookingId);

      if (!booking) {
        return {
          success: false,
          message: 'No encontré esa reserva. ¿Podrías verificar el número de reserva?'
        };
      }

      if (booking.clientId !== clientId) {
        return {
          success: false,
          message: 'Esta reserva no pertenece a tu cuenta.'
        };
      }

      if (booking.status === 'cancelled') {
        return {
          success: true,
          message: 'Esta reserva ya estaba cancelada.',
          booking
        };
      }

      if (booking.status === 'completed') {
        return {
          success: false,
          message: 'No puedo cancelar una reserva que ya fue completada.'
        };
      }

      // Verificar tiempo mínimo de cancelación
      const bookingTime = new Date(booking.dateTime);
      const now = new Date();
      const hoursUntilBooking = (bookingTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilBooking < 2) {
        return {
          success: false,
          message: '⚠️ Lo siento, las reservas solo pueden cancelarse con al menos 2 horas de anticipación. Por favor, contacta directamente a la clínica para cancelaciones de último momento.'
        };
      }

      // Cancelar la reserva
      const cancelledBooking = await BookingService.cancelBooking(bookingId, reason);

      return {
        success: true,
        message: `✅ Tu reserva ha sido cancelada exitosamente.\n\n¿Te gustaría agendar una nueva cita?`,
        booking: cancelledBooking,
        availableActions: ['nueva_reserva']
      };
    } catch (error: any) {
      logger.error('Error cancelling booking:', error);
      return {
        success: false,
        message: `Hubo un problema al cancelar tu reserva: ${error.message}`
      };
    }
  }

  /**
   * Obtener información de una reserva
   */
  static async getBookingInfo(bookingId: string, clientId: string): Promise<BookingManagementResult> {
    try {
      const booking = await BookingModel.findById(bookingId);

      if (!booking) {
        return {
          success: false,
          message: 'No encontré esa reserva. ¿Podrías verificar el número de reserva?'
        };
      }

      if (booking.clientId !== clientId) {
        return {
          success: false,
          message: 'Esta reserva no pertenece a tu cuenta.'
        };
      }

      const dateStr = new Date(booking.dateTime).toLocaleString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const statusEmoji: Record<string, string> = {
        confirmed: '✅',
        cancelled: '❌',
        completed: '✔️',
        no_show: '⚠️'
      };

      // Obtener información del servicio y profesional
      const { ServiceModel } = await import('../../models/Service');
      const { ProfessionalModel } = await import('../../models/Professional');
      
      const service = await ServiceModel.findById(booking.serviceId);
      const serviceName = service?.name || 'Servicio';
      const servicePrice = service?.price || 0;
      
      let professionalName = '';
      if (booking.professionalId) {
        const professional = await ProfessionalModel.findById(booking.professionalId);
        professionalName = professional?.name || '';
      }

      let message = `📋 **Información de tu reserva:**\n\n`;
      message += `${statusEmoji[booking.status] || '📅'} Estado: ${this.getStatusText(booking.status)}\n`;
      message += `📅 Fecha: ${dateStr}\n`;
      message += `💆 Servicio: ${serviceName}\n`;
      message += `⏱️ Duración: ${booking.duration} minutos\n`;
      message += `💰 Precio: $${servicePrice}\n`;

      if (professionalName) {
        message += `👤 Profesional: ${professionalName}\n`;
      }

      if (booking.notes) {
        message += `📝 Notas: ${booking.notes}\n`;
      }

      const availableActions: string[] = [];
      if (booking.status === 'confirmed') {
        availableActions.push('cancelar', 'reagendar');
      }

      if (availableActions.length > 0) {
        message += `\n¿Qué te gustaría hacer? Puedes: ${availableActions.join(', ')}`;
      }

      return {
        success: true,
        message,
        booking,
        availableActions
      };
    } catch (error: any) {
      logger.error('Error getting booking info:', error);
      return {
        success: false,
        message: `Hubo un problema al obtener la información: ${error.message}`
      };
    }
  }

  /**
   * Listar todas las reservas activas del cliente
   */
  static async listClientBookings(clientId: string): Promise<BookingManagementResult> {
    try {
      const bookings = await this.getClientActiveBookings(clientId);

      if (bookings.length === 0) {
        return {
          success: true,
          message: 'No tienes reservas activas en este momento. ¿Te gustaría hacer una nueva reserva?',
          availableActions: ['nueva_reserva']
        };
      }

      let message = `📅 **Tus reservas activas:**\n\n`;

      bookings.forEach((booking, index) => {
        const dateStr = new Date(booking.dateTime).toLocaleString('es-ES', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        const statusEmoji = booking.status === 'confirmed' ? '✅' : '⏳';

        message += `${index + 1}. ${statusEmoji} ${booking.serviceName}\n`;
        message += `   📅 ${dateStr}\n`;
        message += `   💰 $${booking.price}\n\n`;
      });

      message += `\nPara gestionar una reserva, dime el número o el servicio.`;

      return {
        success: true,
        message,
        booking: bookings,
        availableActions: ['confirmar', 'cancelar', 'reagendar', 'ver_detalles']
      };
    } catch (error: any) {
      logger.error('Error listing bookings:', error);
      return {
        success: false,
        message: `Hubo un problema al obtener tus reservas: ${error.message}`
      };
    }
  }

  /**
   * Iniciar proceso de reagendamiento
   */
  static async initiateReschedule(
    bookingId: string,
    clientId: string
  ): Promise<BookingManagementResult> {
    try {
      const booking = await BookingModel.findById(bookingId);

      if (!booking) {
        return {
          success: false,
          message: 'No encontré esa reserva.'
        };
      }

      if (booking.clientId !== clientId) {
        return {
          success: false,
          message: 'Esta reserva no pertenece a tu cuenta.'
        };
      }

      if (booking.status === 'cancelled') {
        return {
          success: false,
          message: 'Esta reserva está cancelada. ¿Te gustaría hacer una nueva reserva?'
        };
      }

      if (booking.status === 'completed') {
        return {
          success: false,
          message: 'Esta reserva ya fue completada. ¿Te gustaría hacer una nueva reserva?'
        };
      }

      // Obtener nombre del servicio
      const { ServiceModel } = await import('../../models/Service');
      const service = await ServiceModel.findById(booking.serviceId);
      const serviceName = service?.name || 'tu cita';

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const rescheduleLink = `${frontendUrl}/reservar?service=${booking.serviceId}&reschedule=${bookingId}`;

      return {
        success: true,
        message: `📅 Para reagendar tu cita de **${serviceName}**, usa este link donde podrás seleccionar una nueva fecha y hora:\n\n🔗 ${rescheduleLink}\n\nSi prefieres cancelar esta cita y hacer una nueva, también puedo ayudarte con eso.`,
        booking,
        availableActions: ['cancelar', 'nueva_reserva']
      };
    } catch (error: any) {
      logger.error('Error initiating reschedule:', error);
      return {
        success: false,
        message: `Hubo un problema: ${error.message}`
      };
    }
  }

  /**
   * Buscar reserva por servicio o fecha
   */
  static async findBookingByContext(
    clientId: string,
    searchTerm: string
  ): Promise<any | null> {
    try {
      const bookings = await this.getClientActiveBookings(clientId);

      if (bookings.length === 0) {
        return null;
      }

      const searchLower = searchTerm.toLowerCase();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Buscar por fecha relativa (hoy, mañana, etc.)
      if (searchLower.includes('hoy') || searchLower.includes('today')) {
        const todayBooking = bookings.find(b => {
          const bookingDate = new Date(b.date);
          bookingDate.setHours(0, 0, 0, 0);
          return bookingDate.getTime() === today.getTime();
        });
        if (todayBooking) {
          return todayBooking;
        }
      }

      if (searchLower.includes('mañana') || searchLower.includes('tomorrow')) {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowBooking = bookings.find(b => {
          const bookingDate = new Date(b.date);
          bookingDate.setHours(0, 0, 0, 0);
          return bookingDate.getTime() === tomorrow.getTime();
        });
        if (tomorrowBooking) {
          return tomorrowBooking;
        }
      }

      // Buscar por nombre de servicio
      const byService = bookings.find(b =>
        b.serviceName.toLowerCase().includes(searchLower)
      );

      if (byService) {
        return byService;
      }

      // Si solo hay una reserva, retornarla
      if (bookings.length === 1) {
        return bookings[0];
      }

      return null;
    } catch (error) {
      logger.error('Error finding booking by context:', error);
      return null;
    }
  }

  /**
   * Obtener texto del estado
   */
  private static getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      pending: 'Pendiente de confirmación',
      confirmed: 'Confirmada',
      cancelled: 'Cancelada',
      completed: 'Completada',
      no_show: 'No asistió'
    };

    return statusMap[status] || status;
  }
}

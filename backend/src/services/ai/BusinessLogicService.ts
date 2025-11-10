import { ServiceModel } from '../../models/Service';
import { ProductModel } from '../../models/Product';
import { BookingModel } from '../../models/Booking';
import { ProfessionalModel } from '../../models/Professional';
import { BookingService } from '../BookingService';
import {
  ConversationContext,
  AIAction,
  Entity,
  PendingBooking
} from '../../types/ai';
import { Service } from '../../types/service';
import { Product } from '../../types/product';
import { Booking, AvailabilityRequest, AvailabilitySlot } from '../../types/booking';
import logger from '../../utils/logger';

export class BusinessLogicService {
  /**
   * Obtener servicios disponibles con filtros opcionales
   */
  static async getServices(filters?: {
    category?: string;
    maxPrice?: number;
    search?: string;
    limit?: number;
  }): Promise<{
    services: Service[];
    message: string;
  }> {
    try {
      const { services } = await ServiceModel.findAll({
        isActive: true,
        category: filters?.category,
        maxPrice: filters?.maxPrice,
        search: filters?.search,
        limit: filters?.limit || 10
      });

      let message = '';
      if (services.length === 0) {
        message = 'No encontré servicios que coincidan con tu búsqueda. ¿Te gustaría ver todos nuestros servicios disponibles?';
      } else {
        message = this.formatServicesMessage(services);
      }

      return { services, message };
    } catch (error) {
      logger.error('Error getting services:', error);
      return {
        services: [],
        message: 'Lo siento, no pude obtener la información de servicios en este momento. ¿Podrías intentar más tarde?'
      };
    }
  }

  /**
   * Obtener detalles de un servicio específico
   */
  static async getServiceDetails(serviceName: string): Promise<{
    service: Service | null;
    message: string;
  }> {
    try {
      const service = await ServiceModel.findByName(serviceName);

      if (!service) {
        const suggestions = await this.findSimilarServices(serviceName);
        const message = suggestions.length > 0
          ? `No encontré "${serviceName}". ¿Te refieres a alguno de estos?\n\n${suggestions.map(s => `• ${s.name}`).join('\n')}`
          : `No encontré el servicio "${serviceName}". ¿Podrías verificar el nombre o ver todos nuestros servicios?`;

        return { service: null, message };
      }

      const message = this.formatServiceDetails(service);
      return { service, message };
    } catch (error) {
      logger.error('Error getting service details:', error);
      return {
        service: null,
        message: 'No pude obtener los detalles del servicio. ¿Podrías intentar de nuevo?'
      };
    }
  }

  /**
   * Consultar disponibilidad para un servicio
   */
  static async checkAvailability(
    serviceId: string,
    preferredDate?: string,
    preferredProfessionalId?: string
  ): Promise<{
    slots: AvailabilitySlot[];
    message: string;
  }> {
    try {
      const service = await ServiceModel.findById(serviceId);
      if (!service) {
        return {
          slots: [],
          message: 'No encontré el servicio especificado.'
        };
      }

      // Determinar rango de fechas
      const dateFrom = preferredDate ? new Date(preferredDate) : new Date();
      const dateTo = new Date(dateFrom);
      dateTo.setDate(dateTo.getDate() + 7); // Próximos 7 días

      const availabilityRequest: AvailabilityRequest = {
        serviceId,
        dateFrom,
        dateTo,
        preferredProfessionalId
      };

      const availability = await BookingModel.getAvailability(availabilityRequest);
      const availableSlots = availability.slots.filter(slot => slot.available);

      let message = '';
      if (availableSlots.length === 0) {
        message = `No hay disponibilidad para ${service.name} en las fechas consultadas. ¿Te gustaría que te contacte un especialista para buscar otras opciones?`;
      } else {
        message = this.formatAvailabilityMessage(service.name, availableSlots);
      }

      return { slots: availableSlots, message };
    } catch (error) {
      logger.error('Error checking availability:', error);
      return {
        slots: [],
        message: 'No pude consultar la disponibilidad en este momento. ¿Podrías intentar más tarde?'
      };
    }
  }

  /**
   * Procesar reserva de cita paso a paso
   */
  static async processBookingStep(
    context: ConversationContext,
    entities: Entity[],
    clientId: string
  ): Promise<{
    updatedBooking: PendingBooking;
    message: string;
    nextStep: string;
    actions: AIAction[];
  }> {
    try {
      const booking = context.pendingBooking || {
        step: 'service_selection'
      };

      const actions: AIAction[] = [];
      let message = '';
      let nextStep = booking.step;

      // Procesar entidades extraídas
      for (const entity of entities) {
        switch (entity.type) {
          case 'service_name':
            const service = await ServiceModel.findByName(entity.value);
            if (service) {
              booking.serviceId = service.id;
              booking.serviceName = service.name;
              nextStep = 'date_selection';
            }
            break;

          case 'date':
            booking.preferredDate = entity.value;
            nextStep = 'time_selection';
            break;

          case 'time':
            booking.preferredTime = entity.value;
            nextStep = 'confirmation';
            break;

          case 'professional_name':
            const professional = await ProfessionalModel.findByName(entity.value);
            if (professional) {
              booking.preferredProfessionalId = professional.id;
            }
            break;
        }
      }

      // Generar mensaje según el paso actual
      switch (nextStep) {
        case 'service_selection':
          const { services } = await this.getServices({ limit: 6 });
          message = `¿Qué servicio te interesa?\n\n${this.formatServicesMessage(services)}`;
          break;

        case 'date_selection':
          if (booking.serviceId) {
            const { slots } = await this.checkAvailability(booking.serviceId);
            const availableDates = this.getAvailableDates(slots);
            message = `Perfecto! Para ${booking.serviceName}, tengo disponibilidad en:\n\n${availableDates}\n\n¿Qué fecha prefieres?`;
          }
          break;

        case 'time_selection':
          if (booking.serviceId && booking.preferredDate) {
            const { slots } = await this.checkAvailability(booking.serviceId, booking.preferredDate);
            const availableTimes = this.getAvailableTimes(slots, booking.preferredDate);
            message = `Para el ${booking.preferredDate}, tengo estos horarios:\n\n${availableTimes}\n\n¿Cuál prefieres?`;
          }
          break;

        case 'confirmation':
          message = await this.generateBookingConfirmation(booking);
          break;

        case 'completed':
          // Crear la reserva
          if (booking.serviceId && booking.preferredDate && booking.preferredTime) {
            actions.push({
              type: 'book_appointment',
              params: {
                clientId,
                serviceId: booking.serviceId,
                dateTime: this.parseDateTime(booking.preferredDate, booking.preferredTime),
                preferredProfessionalId: booking.preferredProfessionalId,
                notes: booking.notes
              }
            });
            message = '✅ ¡Perfecto! Tu cita ha sido reservada exitosamente. Te enviaremos una confirmación y un recordatorio 24h antes.';
          }
          break;
      }

      booking.step = nextStep as any;

      return {
        updatedBooking: booking,
        message,
        nextStep,
        actions
      };
    } catch (error) {
      logger.error('Error processing booking step:', error);
      return {
        updatedBooking: context.pendingBooking || { step: 'service_selection' },
        message: 'Ha ocurrido un error procesando tu reserva. ¿Podrías intentar de nuevo?',
        nextStep: 'service_selection',
        actions: []
      };
    }
  }

  /**
   * Obtener recomendaciones de productos
   */
  static async getProductRecommendations(
    serviceId?: string,
    _clientPreferences?: string[]
  ): Promise<{
    products: Product[];
    message: string;
  }> {
    try {
      let products: Product[] = [];

      if (serviceId) {
        // Productos compatibles con el servicio
        products = await ProductModel.getCompatibleProducts(serviceId);
      } else {
        // Productos populares o por categoría
        const { products: allProducts } = await ProductModel.findAll({
          inStock: true,
          limit: 5
        });
        products = allProducts;
      }

      let message = '';
      if (products.length === 0) {
        message = 'No tengo recomendaciones de productos en este momento.';
      } else {
        message = this.formatProductRecommendations(products, serviceId ? 'compatible' : 'popular');
      }

      return { products, message };
    } catch (error) {
      logger.error('Error getting product recommendations:', error);
      return {
        products: [],
        message: 'No pude obtener recomendaciones de productos en este momento.'
      };
    }
  }

  /**
   * Obtener historial del cliente
   */
  static async getClientHistory(clientId: string): Promise<{
    bookings: Booking[];
    message: string;
  }> {
    try {
      const bookings = await BookingService.getClientBookings(clientId, true);

      let message = '';
      if (bookings.length === 0) {
        message = 'Aún no tienes historial de citas con nosotros. ¿Te gustaría reservar tu primera cita?';
      } else {
        message = this.formatClientHistory(bookings);
      }

      return { bookings, message };
    } catch (error) {
      logger.error('Error getting client history:', error);
      return {
        bookings: [],
        message: 'No pude obtener tu historial en este momento. ¿Podrías intentar más tarde?'
      };
    }
  }

  /**
   * Ejecutar acción de reserva
   */
  static async executeBookingAction(params: any): Promise<{
    success: boolean;
    booking?: Booking;
    message: string;
  }> {
    try {
      const booking = await BookingService.createBooking({
        clientId: params.clientId,
        serviceId: params.serviceId,
        dateTime: params.dateTime,
        preferredProfessionalId: params.preferredProfessionalId,
        notes: params.notes
      });

      return {
        success: true,
        booking,
        message: '✅ ¡Cita reservada exitosamente! Te hemos enviado una confirmación.'
      };
    } catch (error) {
      logger.error('Error executing booking action:', error);
      return {
        success: false,
        message: `No pude completar la reserva: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  // Métodos de formateo privados

  private static formatServicesMessage(services: Service[]): string {
    let message = 'Estos son nuestros servicios disponibles:\n\n';

    services.forEach((service, index) => {
      message += `${index + 1}. **${service.name}**\n`;
      message += `   💰 €${service.price} | ⏱️ ${service.duration}min\n`;
      if (service.description) {
        message += `   ${service.description.substring(0, 80)}...\n`;
      }
      message += '\n';
    });

    message += 'Escribe el nombre del servicio que te interesa para más detalles.';
    return message;
  }

  private static formatServiceDetails(service: Service): string {
    let message = `**${service.name}**\n\n`;

    if (service.description) {
      message += `${service.description}\n\n`;
    }

    message += `💰 **Precio:** €${service.price}\n`;
    message += `⏱️ **Duración:** ${service.duration} minutos\n`;

    if (service.requirements && service.requirements.length > 0) {
      message += `\n📋 **Requisitos:**\n`;
      service.requirements.forEach(req => {
        message += `• ${req}\n`;
      });
    }

    message += '\n¿Te gustaría reservar este tratamiento?';
    return message;
  }

  private static formatAvailabilityMessage(serviceName: string, slots: AvailabilitySlot[]): string {
    const groupedByDate = this.groupSlotsByDate(slots);

    let message = `Disponibilidad para ${serviceName}:\n\n`;

    Object.entries(groupedByDate).forEach(([date, dateSlots]) => {
      const formattedDate = new Date(date).toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });

      message += `📅 **${formattedDate}**\n`;
      const times = dateSlots.map(slot =>
        slot.dateTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      ).slice(0, 4); // Mostrar máximo 4 horarios por día

      message += `   ${times.join(' • ')}\n\n`;
    });

    message += 'Dime la fecha y hora que prefieres.';
    return message;
  }

  private static formatProductRecommendations(products: Product[], type: 'compatible' | 'popular'): string {
    const title = type === 'compatible'
      ? 'Productos recomendados para tu tratamiento:'
      : 'Productos populares que podrían interesarte:';

    let message = `${title}\n\n`;

    products.forEach((product, index) => {
      message += `${index + 1}. **${product.name}**\n`;
      message += `   💰 €${product.price}\n`;
      if (product.stock > 0) {
        message += `   ✅ Disponible\n`;
      } else {
        message += `   ❌ Agotado\n`;
      }
      message += '\n';
    });

    return message;
  }

  private static formatClientHistory(bookings: Booking[]): string {
    let message = 'Tu historial de citas:\n\n';

    const recentBookings = bookings.slice(0, 5); // Mostrar últimas 5 citas

    recentBookings.forEach((booking, index) => {
      const date = booking.dateTime.toLocaleDateString('es-ES');
      const status = this.getStatusEmoji(booking.status);

      message += `${index + 1}. ${date} ${status}\n`;
      // Aquí necesitaríamos obtener el nombre del servicio
      message += `   Servicio: ${booking.serviceId}\n\n`;
    });

    if (bookings.length > 5) {
      message += `... y ${bookings.length - 5} citas más.\n\n`;
    }

    message += '¿Te gustaría reservar una nueva cita?';
    return message;
  }

  private static async generateBookingConfirmation(booking: PendingBooking): Promise<string> {
    let message = '📋 **Resumen de tu cita:**\n\n';

    message += `🎯 **Servicio:** ${booking.serviceName}\n`;
    message += `📅 **Fecha:** ${booking.preferredDate}\n`;
    message += `⏰ **Hora:** ${booking.preferredTime}\n`;

    if (booking.preferredProfessionalId) {
      try {
        const professional = await ProfessionalModel.findById(booking.preferredProfessionalId);
        if (professional) {
          message += `👩‍⚕️ **Profesional:** ${professional.name}\n`;
        }
      } catch (error) {
        // Continuar sin mostrar profesional
      }
    }

    if (booking.serviceId) {
      try {
        const service = await ServiceModel.findById(booking.serviceId);
        if (service) {
          message += `💰 **Precio:** €${service.price}\n`;
        }
      } catch (error) {
        // Continuar sin mostrar precio
      }
    }

    message += '\n¿Confirmas la reserva? (Responde "sí" para confirmar o "no" para cancelar)';
    return message;
  }

  // Métodos de utilidad privados

  private static async findSimilarServices(searchTerm: string): Promise<Service[]> {
    const { services } = await ServiceModel.findAll({
      isActive: true,
      search: searchTerm,
      limit: 3
    });
    return services;
  }

  private static groupSlotsByDate(slots: AvailabilitySlot[]): Record<string, AvailabilitySlot[]> {
    return slots.reduce((groups, slot) => {
      const date = slot.dateTime.toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(slot);
      return groups;
    }, {} as Record<string, AvailabilitySlot[]>);
  }

  private static getAvailableDates(slots: AvailabilitySlot[]): string {
    const dates = [...new Set(slots.map(slot =>
      slot.dateTime.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      })
    ))].slice(0, 5);

    return dates.map(date => `• ${date}`).join('\n');
  }

  private static getAvailableTimes(slots: AvailabilitySlot[], date: string): string {
    const daySlots = slots.filter(slot => {
      const slotDate = slot.dateTime.toLocaleDateString('es-ES');
      return slotDate === date || slot.dateTime.toDateString().includes(date);
    });

    const times = daySlots.map(slot =>
      slot.dateTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    ).slice(0, 6);

    return times.map(time => `• ${time}`).join('\n');
  }

  private static parseDateTime(date: string, time: string): Date {
    // Implementación simple - en producción sería más robusta
    const dateTime = new Date(`${date} ${time}`);
    return dateTime;
  }

  private static getStatusEmoji(status: string): string {
    switch (status) {
      case 'completed': return '✅';
      case 'confirmed': return '📅';
      case 'cancelled': return '❌';
      case 'no_show': return '⚠️';
      default: return '📋';
    }
  }
}
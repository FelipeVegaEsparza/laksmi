import db from '../config/database';
import { Booking, CreateBookingRequest, UpdateBookingRequest, BookingFilters, AvailabilityRequest, AvailabilitySlot, AvailabilityResponse, BookingConflict, BookingValidationResult, BookingStats } from '../types/booking';
import { ProfessionalModel } from './Professional';
import { ServiceModel } from './Service';

export class BookingModel {
  static async findById(id: string): Promise<Booking | null> {
    const booking = await db('bookings').where({ id }).first();
    if (!booking) return null;
    
    return this.formatBooking(booking);
  }

  static async create(bookingData: CreateBookingRequest): Promise<Booking> {
    // Validar que el servicio existe
    const service = await ServiceModel.findById(bookingData.serviceId);
    if (!service) {
      throw new Error('Servicio no encontrado');
    }

    // Asignar profesional automáticamente si no se especifica
    let professionalId = bookingData.preferredProfessionalId;
    if (!professionalId) {
      try {
        const assignedProfessionalId = await this.assignProfessional(bookingData.serviceId, bookingData.dateTime, service.duration);
        if (assignedProfessionalId) {
          professionalId = assignedProfessionalId;
        }
        // Si no hay profesional disponible, continuar sin asignar (será null)
      } catch (error) {
        // Si hay error al asignar profesional, continuar sin asignar
        console.warn('No se pudo asignar profesional automáticamente:', error);
      }
    }

    // Validar disponibilidad solo si hay profesional asignado
    if (professionalId) {
      const validation = await this.validateBooking({
        clientId: bookingData.clientId,
        serviceId: bookingData.serviceId,
        professionalId,
        dateTime: bookingData.dateTime,
        duration: service.duration
      });

      if (!validation.isValid) {
        throw new Error(`No se puede crear la cita: ${validation.conflicts.map(c => c.message).join(', ')}`);
      }
    }

    const insertData = {
      client_id: bookingData.clientId,
      service_id: bookingData.serviceId,
      professional_id: professionalId,
      date_time: bookingData.dateTime,
      duration: service.duration,
      status: 'confirmed',
      notes: bookingData.notes || null
    };

    await db('bookings').insert(insertData);

    // Buscar la cita recién creada
    const booking = await db('bookings')
      .where({
        client_id: bookingData.clientId,
        service_id: bookingData.serviceId,
        date_time: bookingData.dateTime
      })
      .first();
    
    if (!booking) {
      throw new Error('Error creating booking');
    }

    return this.formatBooking(booking);
  }

  static async update(id: string, updates: UpdateBookingRequest): Promise<Booking | null> {
    const existingBooking = await this.findById(id);
    if (!existingBooking) {
      return null;
    }

    const updateData: any = {};
    
    if (updates.dateTime !== undefined) {
      // Validar nueva fecha/hora si se está cambiando
      const validation = await this.validateBooking({
        clientId: existingBooking.clientId,
        serviceId: existingBooking.serviceId,
        professionalId: updates.professionalId || existingBooking.professionalId!,
        dateTime: updates.dateTime,
        duration: existingBooking.duration,
        excludeBookingId: id
      });

      if (!validation.isValid) {
        throw new Error(`No se puede actualizar la cita: ${validation.conflicts.map(c => c.message).join(', ')}`);
      }

      updateData.date_time = updates.dateTime;
    }
    
    if (updates.professionalId !== undefined) updateData.professional_id = updates.professionalId;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    
    updateData.updated_at = new Date();

    const result = await db('bookings').where({ id }).update(updateData);
    
    if (result === 0) {
      return null;
    }

    return this.findById(id);
  }

  static async findAll(filters: BookingFilters = {}): Promise<{ bookings: Booking[]; total: number }> {
    const { 
      clientId, 
      professionalId, 
      serviceId, 
      status, 
      dateFrom, 
      dateTo, 
      page = 1, 
      limit = 10 
    } = filters;
    
    let query = db('bookings').select('*');

    // Aplicar filtros
    if (clientId) {
      query = query.where('client_id', clientId);
    }

    if (professionalId) {
      query = query.where('professional_id', professionalId);
    }

    if (serviceId) {
      query = query.where('service_id', serviceId);
    }

    if (status) {
      query = query.where('status', status);
    }

    if (dateFrom) {
      query = query.where('date_time', '>=', dateFrom);
    }

    if (dateTo) {
      query = query.where('date_time', '<=', dateTo);
    }

    // Contar total de registros
    const countQuery = query.clone();
    const [{ count }] = await countQuery.count('* as count');
    const total = parseInt(count as string);

    // Aplicar paginación
    const offset = (page - 1) * limit;
    query = query.limit(limit).offset(offset).orderBy('date_time', 'desc');

    const bookings = await query;
    
    return {
      bookings: bookings.map(booking => this.formatBooking(booking)),
      total
    };
  }

  static async delete(id: string): Promise<boolean> {
    const result = await db('bookings').where({ id }).del();
    return result > 0;
  }

  static async getAvailability(request: AvailabilityRequest): Promise<AvailabilityResponse> {
    const service = await ServiceModel.findById(request.serviceId);
    if (!service) {
      throw new Error('Servicio no encontrado');
    }

    // Obtener profesionales que pueden realizar este servicio
    const professionals = await ProfessionalModel.findBySpecialty(request.serviceId);
    
    if (professionals.length === 0) {
      return {
        serviceId: request.serviceId,
        serviceName: service.name,
        serviceDuration: service.duration,
        dateFrom: request.dateFrom,
        dateTo: request.dateTo,
        slots: []
      };
    }

    const slots: AvailabilitySlot[] = [];
    const currentDate = new Date(request.dateFrom);
    const endDate = new Date(request.dateTo);

    // Generar slots para cada día en el rango
    while (currentDate <= endDate) {
      for (const professional of professionals) {
        // Si se especifica un profesional preferido, solo usar ese
        if (request.preferredProfessionalId && professional.id !== request.preferredProfessionalId) {
          continue;
        }

        const daySlots = await this.generateDaySlots(
          professional.id,
          professional.name,
          currentDate,
          service.duration
        );
        
        slots.push(...daySlots);
      }
      
      // Avanzar al siguiente día
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Ordenar por fecha y hora
    slots.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

    return {
      serviceId: request.serviceId,
      serviceName: service.name,
      serviceDuration: service.duration,
      dateFrom: request.dateFrom,
      dateTo: request.dateTo,
      slots
    };
  }

  static async validateBooking(data: {
    clientId: string;
    serviceId: string;
    professionalId: string;
    dateTime: Date;
    duration: number;
    excludeBookingId?: string;
  }): Promise<BookingValidationResult> {
    const conflicts: BookingConflict[] = [];

    // Validar que la fecha no sea en el pasado
    if (data.dateTime < new Date()) {
      conflicts.push({
        type: 'past_date',
        message: 'No se pueden crear citas en el pasado'
      });
    }

    // Validar que el profesional puede realizar este servicio
    const professional = await ProfessionalModel.findById(data.professionalId);
    if (!professional) {
      conflicts.push({
        type: 'service_mismatch',
        message: 'Profesional no encontrado'
      });
    } else if (!professional.specialties.includes(data.serviceId)) {
      conflicts.push({
        type: 'service_mismatch',
        message: 'El profesional no puede realizar este servicio'
      });
    }

    // Validar disponibilidad del profesional
    const isAvailable = await ProfessionalModel.isAvailableAtTime(
      data.professionalId,
      data.dateTime,
      data.duration
    );

    if (!isAvailable) {
      // Buscar cita conflictiva
      const endTime = new Date(data.dateTime.getTime() + data.duration * 60000);
      
      let conflictQuery = db('bookings')
        .where('professional_id', data.professionalId)
        .where('status', 'confirmed')
        .where(function() {
          this.where(function() {
            this.where('date_time', '<=', data.dateTime)
              .whereRaw('DATE_ADD(date_time, INTERVAL duration MINUTE) > ?', [data.dateTime]);
          }).orWhere(function() {
            this.where('date_time', '<', endTime)
              .whereRaw('DATE_ADD(date_time, INTERVAL duration MINUTE) >= ?', [endTime]);
          });
        });

      if (data.excludeBookingId) {
        conflictQuery = conflictQuery.where('id', '!=', data.excludeBookingId);
      }

      const conflictingBooking = await conflictQuery.first();

      conflicts.push({
        type: 'professional_busy',
        message: 'El profesional no está disponible en este horario',
        conflictingBooking: conflictingBooking ? this.formatBooking(conflictingBooking) : undefined
      });
    }

    return {
      isValid: conflicts.length === 0,
      conflicts
    };
  }

  static async assignProfessional(serviceId: string, dateTime: Date, duration: number): Promise<string | null> {
    const professionals = await ProfessionalModel.findBySpecialty(serviceId);
    
    for (const professional of professionals) {
      const isAvailable = await ProfessionalModel.isAvailableAtTime(
        professional.id,
        dateTime,
        duration
      );
      
      if (isAvailable) {
        return professional.id;
      }
    }
    
    return null;
  }

  static async getBookingStats(dateFrom?: Date, dateTo?: Date): Promise<BookingStats> {
    let query = db('bookings');
    
    if (dateFrom) {
      query = query.where('date_time', '>=', dateFrom);
    }
    
    if (dateTo) {
      query = query.where('date_time', '<=', dateTo);
    }

    const [totalResult] = await query.clone().count('* as count');
    const totalBookings = parseInt(totalResult.count as string);

    const statusCounts = await query.clone()
      .select('status')
      .count('* as count')
      .groupBy('status');

    const statusMap = statusCounts.reduce((acc, row) => {
      acc[row.status] = parseInt(row.count as string);
      return acc;
    }, {} as Record<string, number>);

    // Citas de hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayResult] = await db('bookings')
      .where('date_time', '>=', today)
      .where('date_time', '<', tomorrow)
      .count('* as count');
    const todayBookings = parseInt(todayResult.count as string);

    // Citas futuras
    const now = new Date();
    const [upcomingResult] = await db('bookings')
      .where('date_time', '>', now)
      .where('status', 'confirmed')
      .count('* as count');
    const upcomingBookings = parseInt(upcomingResult.count as string);

    // Calcular ingresos (necesitaríamos unir con servicios para obtener precios)
    let revenueQuery = db('bookings')
      .join('services', 'bookings.service_id', 'services.id')
      .where('bookings.status', 'completed');
    
    if (dateFrom) {
      revenueQuery = revenueQuery.where('bookings.date_time', '>=', dateFrom);
    }
    
    if (dateTo) {
      revenueQuery = revenueQuery.where('bookings.date_time', '<=', dateTo);
    }

    const [revenueResult] = await revenueQuery
      .sum('services.price as total_revenue')
      .count('* as completed_count');

    const revenue = parseFloat(revenueResult.total_revenue as string) || 0;
    const completedCount = parseInt(revenueResult.completed_count as string) || 0;
    const averageBookingValue = completedCount > 0 ? revenue / completedCount : 0;

    return {
      totalBookings,
      confirmedBookings: parseInt(String(statusMap.confirmed || 0)),
      cancelledBookings: parseInt(String(statusMap.cancelled || 0)),
      completedBookings: parseInt(String(statusMap.completed || 0)),
      noShowBookings: parseInt(String(statusMap.no_show || 0)),
      todayBookings,
      upcomingBookings,
      revenue,
      averageBookingValue
    };
  }

  private static async generateDaySlots(
    professionalId: string,
    professionalName: string,
    date: Date,
    serviceDuration: number
  ): Promise<AvailabilitySlot[]> {
    const slots: AvailabilitySlot[] = [];
    const workingHours = await ProfessionalModel.getWorkingHours(professionalId, date);
    
    for (const shift of workingHours) {
      const shiftStart = this.parseTimeString(date, shift.startTime);
      const shiftEnd = this.parseTimeString(date, shift.endTime);
      
      // Generar slots cada 30 minutos dentro del turno
      const slotInterval = 30; // minutos
      let currentTime = new Date(shiftStart);
      
      while (currentTime.getTime() + serviceDuration * 60000 <= shiftEnd.getTime()) {
        const isAvailable = await ProfessionalModel.isAvailableAtTime(
          professionalId,
          currentTime,
          serviceDuration
        );
        
        slots.push({
          dateTime: new Date(currentTime),
          professionalId,
          professionalName,
          duration: serviceDuration,
          available: isAvailable
        });
        
        // Avanzar al siguiente slot
        currentTime.setMinutes(currentTime.getMinutes() + slotInterval);
      }
    }
    
    return slots;
  }

  private static parseTimeString(date: Date, timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  private static formatBooking(dbBooking: any): Booking {
    return {
      id: dbBooking.id,
      clientId: dbBooking.client_id,
      serviceId: dbBooking.service_id,
      professionalId: dbBooking.professional_id,
      dateTime: new Date(dbBooking.date_time),
      duration: dbBooking.duration,
      status: dbBooking.status,
      notes: dbBooking.notes,
      createdAt: dbBooking.created_at,
      updatedAt: dbBooking.updated_at
    };
  }
}
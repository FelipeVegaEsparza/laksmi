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
      status: bookingData.status || 'pending_payment',
      notes: bookingData.notes || null,
      payment_amount: bookingData.paymentAmount || 20000,
      payment_method: bookingData.paymentMethod || null,
      payment_notes: bookingData.paymentNotes || null
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
    if (updates.status !== undefined) {
      updateData.status = updates.status;
      // Si el estado cambia a confirmed y no tiene paid_at, establecerlo
      if (updates.status === 'confirmed' && !existingBooking.paidAt) {
        updateData.paid_at = new Date();
      }
    }
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.paymentAmount !== undefined) updateData.payment_amount = updates.paymentAmount;
    if (updates.paymentMethod !== undefined) updateData.payment_method = updates.paymentMethod;
    if (updates.paymentNotes !== undefined) updateData.payment_notes = updates.paymentNotes;
    if (updates.paidAt !== undefined) updateData.paid_at = updates.paidAt;
    
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
    
    let query = db('bookings')
      .select(
        'bookings.*',
        'clients.name as client_name',
        'clients.email as client_email',
        'clients.phone as client_phone',
        'services.name as service_name',
        'services.price as service_price',
        'professionals.name as professional_name'
      )
      .leftJoin('clients', 'bookings.client_id', 'clients.id')
      .leftJoin('services', 'bookings.service_id', 'services.id')
      .leftJoin('professionals', 'bookings.professional_id', 'professionals.id');

    // Aplicar filtros
    if (clientId) {
      query = query.where('bookings.client_id', clientId);
    }

    if (professionalId) {
      query = query.where('bookings.professional_id', professionalId);
    }

    if (serviceId) {
      query = query.where('bookings.service_id', serviceId);
    }

    if (status) {
      query = query.where('bookings.status', status);
    }

    if (dateFrom) {
      query = query.where('bookings.date_time', '>=', dateFrom);
    }

    if (dateTo) {
      query = query.where('bookings.date_time', '<=', dateTo);
    }

    // Contar total de registros
    const countQuery = db('bookings').count('* as count');
    if (clientId) countQuery.where('client_id', clientId);
    if (professionalId) countQuery.where('professional_id', professionalId);
    if (serviceId) countQuery.where('service_id', serviceId);
    if (status) countQuery.where('status', status);
    if (dateFrom) countQuery.where('date_time', '>=', dateFrom);
    if (dateTo) countQuery.where('date_time', '<=', dateTo);
    
    const [{ count }] = await countQuery;
    const total = parseInt(count as string);

    // Aplicar paginación
    const offset = (page - 1) * limit;
    query = query.limit(limit).offset(offset).orderBy('bookings.date_time', 'desc');

    const bookings = await query;
    
    return {
      bookings: bookings.map(booking => this.formatBookingWithRelations(booking)),
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

    // Obtener horarios del local desde company_settings
    const companySettings = await db('company_settings').first();
    if (!companySettings || !companySettings.business_hours) {
      return {
        serviceId: request.serviceId,
        serviceName: service.name,
        serviceDuration: service.duration,
        dateFrom: request.dateFrom,
        dateTo: request.dateTo,
        slots: []
      };
    }

    const businessHours = typeof companySettings.business_hours === 'string' 
      ? JSON.parse(companySettings.business_hours) 
      : companySettings.business_hours;

    const slots: AvailabilitySlot[] = [];
    const currentDate = new Date(request.dateFrom);
    const endDate = new Date(request.dateTo);

    // Generar slots para cada día en el rango basado en horarios del local
    while (currentDate <= endDate) {
      const daySlots = await this.generateDaySlotsFromBusinessHours(
        currentDate,
        service.duration,
        businessHours
      );
      
      slots.push(...daySlots);
      
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
      pendingPaymentBookings: parseInt(String(statusMap.pending_payment || 0)),
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

  private static async generateDaySlotsFromBusinessHours(
    date: Date,
    serviceDuration: number,
    businessHours: any
  ): Promise<AvailabilitySlot[]> {
    const slots: AvailabilitySlot[] = [];
    
    // Obtener el día de la semana
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()];
    const daySchedule = businessHours[dayName];
    
    // Si el local está cerrado ese día, no hay slots
    if (!daySchedule || !daySchedule.isOpen) {
      return slots;
    }
    
    const openTime = this.parseTimeString(date, daySchedule.openTime);
    const closeTime = this.parseTimeString(date, daySchedule.closeTime);
    const lunchStart = daySchedule.lunchStart ? this.parseTimeString(date, daySchedule.lunchStart) : null;
    const lunchEnd = daySchedule.lunchEnd ? this.parseTimeString(date, daySchedule.lunchEnd) : null;
    
    // Generar slots cada 30 minutos
    const slotInterval = 30; // minutos
    let currentTime = new Date(openTime);
    
    while (currentTime.getTime() + serviceDuration * 60000 <= closeTime.getTime()) {
      // Verificar si el slot está en horario de colación
      const isInLunchTime = lunchStart && lunchEnd && 
        currentTime.getTime() >= lunchStart.getTime() && 
        currentTime.getTime() < lunchEnd.getTime();
      
      if (!isInLunchTime) {
        // Verificar si hay conflicto con citas existentes
        const isAvailable = await this.isTimeSlotAvailable(currentTime, serviceDuration);
        
        slots.push({
          dateTime: new Date(currentTime),
          professionalId: 'general', // Ya no usamos profesionales específicos
          professionalName: 'Disponible',
          duration: serviceDuration,
          available: isAvailable
        });
      }
      
      // Avanzar al siguiente slot
      currentTime.setMinutes(currentTime.getMinutes() + slotInterval);
    }
    
    return slots;
  }

  private static async isTimeSlotAvailable(dateTime: Date, duration: number): Promise<boolean> {
    const endTime = new Date(dateTime.getTime() + duration * 60000);
    
    // Buscar citas confirmadas que se solapen con este horario
    const conflictingBookings = await db('bookings')
      .where('status', 'confirmed')
      .where(function() {
        this.where(function() {
          // La cita existente empieza antes y termina después del inicio del slot
          this.where('date_time', '<=', dateTime)
            .whereRaw('DATE_ADD(date_time, INTERVAL duration MINUTE) > ?', [dateTime]);
        }).orWhere(function() {
          // La cita existente empieza durante el slot
          this.where('date_time', '<', endTime)
            .whereRaw('DATE_ADD(date_time, INTERVAL duration MINUTE) >= ?', [endTime]);
        }).orWhere(function() {
          // La cita existente está completamente dentro del slot
          this.where('date_time', '>=', dateTime)
            .where('date_time', '<', endTime);
        });
      })
      .first();
    
    return !conflictingBookings;
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
      paymentAmount: parseFloat(dbBooking.payment_amount) || 20000,
      paymentMethod: dbBooking.payment_method,
      paymentNotes: dbBooking.payment_notes,
      paidAt: dbBooking.paid_at ? new Date(dbBooking.paid_at) : undefined,
      createdAt: dbBooking.created_at,
      updatedAt: dbBooking.updated_at
    };
  }

  private static formatBookingWithRelations(dbBooking: any): any {
    return {
      id: dbBooking.id,
      clientId: dbBooking.client_id,
      serviceId: dbBooking.service_id,
      professionalId: dbBooking.professional_id,
      dateTime: new Date(dbBooking.date_time),
      duration: dbBooking.duration,
      status: dbBooking.status,
      notes: dbBooking.notes,
      paymentAmount: parseFloat(dbBooking.payment_amount) || 20000,
      paymentMethod: dbBooking.payment_method,
      paymentNotes: dbBooking.payment_notes,
      paidAt: dbBooking.paid_at ? new Date(dbBooking.paid_at) : undefined,
      createdAt: dbBooking.created_at,
      updatedAt: dbBooking.updated_at,
      // Objetos anidados para el frontend
      client: dbBooking.client_name ? {
        id: dbBooking.client_id,
        name: dbBooking.client_name,
        email: dbBooking.client_email,
        phone: dbBooking.client_phone
      } : null,
      service: dbBooking.service_name ? {
        id: dbBooking.service_id,
        name: dbBooking.service_name,
        price: dbBooking.service_price
      } : null,
      professional: dbBooking.professional_name ? {
        id: dbBooking.professional_id,
        name: dbBooking.professional_name
      } : null
    };
  }
}
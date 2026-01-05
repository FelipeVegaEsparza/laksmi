import db from '../config/database';
import { Booking, CreateBookingRequest, UpdateBookingRequest, BookingFilters, AvailabilityRequest, AvailabilitySlot, AvailabilityResponse, BookingConflict, BookingValidationResult, BookingStats } from '../types/booking';
import { ProfessionalModel } from './Professional';
import { ServiceModel } from './Service';
import { parseChileDateTime } from '../utils/timezone';

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

    // Ya no asignamos profesionales automáticamente
    // El sistema ahora funciona basado en horarios del local
    const professionalId = bookingData.preferredProfessionalId || null;

    // Asignación automática de box si no se especificó
    let assignedBox = bookingData.box;
    
    if (!assignedBox) {
      // Asignar automáticamente el box disponible
      assignedBox = await this.findAvailableBox(bookingData.dateTime, service.duration);
      
      if (!assignedBox) {
        throw new Error('No hay boxes disponibles en el horario seleccionado');
      }
      
      console.log(`🎯 Box asignado automáticamente: ${assignedBox}`);
    } else {
      // Si se especificó un box, validar que esté disponible
      const isAvailable = await this.isTimeSlotAvailableInBox(
        bookingData.dateTime, 
        service.duration, 
        assignedBox
      );
      
      if (!isAvailable) {
        throw new Error('El horario seleccionado ya no está disponible en el box especificado');
      }
    }

    const status = bookingData.status || 'pending_payment';
    
    const insertData: any = {
      client_id: bookingData.clientId,
      service_id: bookingData.serviceId,
      professional_id: professionalId,
      box: assignedBox,
      date_time: bookingData.dateTime,
      duration: service.duration,
      status: status,
      notes: bookingData.notes || null,
      payment_amount: bookingData.paymentAmount || service.price,
      payment_method: bookingData.paymentMethod || null,
      payment_notes: bookingData.paymentNotes || null
    };

    // Si se crea con status confirmed, establecer paid_at
    if (status === 'confirmed') {
      insertData.paid_at = new Date();
    }

    console.log('📝 Insertando reserva:', insertData);

    try {
      const [insertedId] = await db('bookings').insert(insertData);
      console.log('✅ Reserva insertada con ID:', insertedId);

      // Buscar la cita recién creada
      const booking = await db('bookings')
        .where({
          client_id: bookingData.clientId,
          service_id: bookingData.serviceId,
          date_time: bookingData.dateTime
        })
        .first();
      
      if (!booking) {
        console.error('❌ No se encontró la reserva después de insertarla');
        throw new Error('Error creating booking');
      }

      console.log('✅ Reserva creada exitosamente:', booking.id);
      return this.formatBooking(booking);
    } catch (error) {
      console.error('❌ Error al insertar reserva:', error);
      throw error;
    }
  }

  static async update(id: string, updates: UpdateBookingRequest): Promise<Booking | null> {
    const existingBooking = await this.findById(id);
    if (!existingBooking) {
      return null;
    }

    const updateData: any = {};
    
    if (updates.dateTime !== undefined) {
      // Validar que el nuevo horario esté disponible
      // Obtener la duración del servicio
      const service = await ServiceModel.findById(existingBooking.serviceId);
      if (!service) {
        throw new Error('Servicio no encontrado');
      }

      // Verificar disponibilidad del horario (excluyendo esta cita)
      const isAvailable = await this.isTimeSlotAvailableInBoxExcluding(
        updates.dateTime,
        service.duration,
        updates.box || existingBooking.box,
        id
      );

      if (!isAvailable) {
        throw new Error('El horario seleccionado ya no está disponible en el box especificado');
      }

      updateData.date_time = updates.dateTime;
    }
    
    if (updates.professionalId !== undefined) updateData.professional_id = updates.professionalId;
    if (updates.box !== undefined) updateData.box = updates.box;
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
      box,
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

    if (box) {
      query = query.where('bookings.box', box);
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
    if (box) countQuery.where('box', box);
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
    const lunchStart = daySchedule.lunchStart && daySchedule.lunchStart.trim() !== '' 
      ? this.parseTimeString(date, daySchedule.lunchStart) 
      : null;
    const lunchEnd = daySchedule.lunchEnd && daySchedule.lunchEnd.trim() !== '' 
      ? this.parseTimeString(date, daySchedule.lunchEnd) 
      : null;
    
    // Generar slots cada 30 minutos
    const slotInterval = 30; // minutos
    let currentTime = new Date(openTime);
    
    while (currentTime.getTime() + serviceDuration * 60000 <= closeTime.getTime()) {
      // Verificar si el slot está en horario de colación
      const isInLunchTime = lunchStart && lunchEnd && 
        currentTime.getTime() >= lunchStart.getTime() && 
        currentTime.getTime() < lunchEnd.getTime();
      
      if (!isInLunchTime) {
        // Verificar si hay conflicto con citas existentes o bloques bloqueados
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
    return this.isTimeSlotAvailableExcluding(dateTime, duration, null);
  }

  private static async findAvailableBox(
    dateTime: Date, 
    duration: number
  ): Promise<'box1' | 'box2' | null> {
    // Verificar disponibilidad de ambos boxes
    const box1Available = await this.isTimeSlotAvailableInBox(dateTime, duration, 'box1');
    const box2Available = await this.isTimeSlotAvailableInBox(dateTime, duration, 'box2');
    
    console.log('🔍 Disponibilidad de boxes:', { box1Available, box2Available });
    
    // Si ninguno está disponible, retornar null
    if (!box1Available && !box2Available) {
      return null;
    }
    
    // Si solo uno está disponible, retornarlo
    if (box1Available && !box2Available) {
      return 'box1';
    }
    if (box2Available && !box1Available) {
      return 'box2';
    }
    
    // Si ambos están disponibles, hacer balanceo de carga
    // Contar citas del día en cada box para balancear
    const dayStart = new Date(dateTime);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dateTime);
    dayEnd.setHours(23, 59, 59, 999);
    
    const [box1Count] = await db('bookings')
      .where('box', 'box1')
      .whereIn('status', ['confirmed', 'pending_payment'])
      .where('date_time', '>=', dayStart)
      .where('date_time', '<=', dayEnd)
      .count('* as count');
    
    const [box2Count] = await db('bookings')
      .where('box', 'box2')
      .whereIn('status', ['confirmed', 'pending_payment'])
      .where('date_time', '>=', dayStart)
      .where('date_time', '<=', dayEnd)
      .count('* as count');
    
    const box1Total = parseInt(box1Count.count as string);
    const box2Total = parseInt(box2Count.count as string);
    
    console.log('📊 Balanceo de carga:', { box1Total, box2Total });
    
    // Asignar al box con menos citas del día
    return box1Total <= box2Total ? 'box1' : 'box2';
  }

  private static async isTimeSlotAvailableInBox(
    dateTime: Date, 
    duration: number, 
    box?: 'box1' | 'box2'
  ): Promise<boolean> {
    return this.isTimeSlotAvailableInBoxExcluding(dateTime, duration, box, null);
  }

  private static async isTimeSlotAvailableInBoxExcluding(
    dateTime: Date, 
    duration: number, 
    box: 'box1' | 'box2' | undefined,
    excludeBookingId: string | null
  ): Promise<boolean> {
    const endTime = new Date(dateTime.getTime() + duration * 60000);
    
    // Log para debugging
    console.log('🔍 Verificando disponibilidad en box:', {
      dateTime: dateTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      box,
      excludeBookingId
    });
    
    // Verificar bloques bloqueados (aplica a todos los boxes)
    const blockedSlot = await db('blocked_time_slots')
      .where(function() {
        this.where(function() {
          this.where('start_time', '<=', dateTime)
            .where('end_time', '>', dateTime);
        })
        .orWhere(function() {
          this.where('start_time', '>=', dateTime)
            .where('start_time', '<', endTime);
        })
        .orWhere(function() {
          this.where('end_time', '=', dateTime);
        });
      })
      .first();

    if (blockedSlot) {
      console.log('❌ Bloqueado por bloque de tiempo');
      return false;
    }
    
    // Si se especifica un box, verificar solo ese box
    // Si no se especifica box, verificar que al menos un box esté disponible
    if (box) {
      // Verificar disponibilidad en el box específico
      let query = db('bookings')
        .where('box', box)
        .whereIn('status', ['confirmed', 'pending_payment'])
        .where(function() {
          this.where(function() {
            this.where('date_time', '<=', dateTime)
              .whereRaw('DATE_ADD(date_time, INTERVAL duration MINUTE) > ?', [dateTime]);
          }).orWhere(function() {
            this.where('date_time', '<', endTime)
              .whereRaw('DATE_ADD(date_time, INTERVAL duration MINUTE) >= ?', [endTime]);
          }).orWhere(function() {
            this.where('date_time', '>=', dateTime)
              .where('date_time', '<', endTime);
          });
        });

      if (excludeBookingId) {
        query = query.where('id', '!=', excludeBookingId);
      }

      const conflictingBooking = await query.first();
      
      if (conflictingBooking) {
        console.log('❌ Conflicto encontrado en box:', box);
        return false;
      }
      
      console.log('✅ Box disponible:', box);
      return true;
    } else {
      // No se especificó box: verificar si AL MENOS UN box está disponible
      // Esto es para el frontend público
      const box1Available = await this.isTimeSlotAvailableInBoxExcluding(dateTime, duration, 'box1', excludeBookingId);
      const box2Available = await this.isTimeSlotAvailableInBoxExcluding(dateTime, duration, 'box2', excludeBookingId);
      
      const available = box1Available || box2Available;
      console.log('✅ Disponibilidad general:', { box1Available, box2Available, available });
      return available;
    }
  }

  private static async isTimeSlotAvailableExcluding(
    dateTime: Date, 
    duration: number, 
    excludeBookingId: string | null
  ): Promise<boolean> {
    const endTime = new Date(dateTime.getTime() + duration * 60000);
    
    // Log para debugging
    console.log('🔍 Verificando disponibilidad:', {
      dateTime: dateTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      excludeBookingId
    });
    
    // Verificar bloques bloqueados
    // Un slot NO está disponible si se solapa con algún bloque
    const blockedSlot = await db('blocked_time_slots')
      .where(function() {
        this.where(function() {
          // Caso 1: El bloque cubre el inicio del slot
          // Bloque: [10:00 - 11:00], Slot: [10:30 - 11:30] → Bloqueado
          this.where('start_time', '<=', dateTime)
            .where('end_time', '>', dateTime);
        })
        .orWhere(function() {
          // Caso 2: El bloque empieza durante el slot
          // Bloque: [10:30 - 11:30], Slot: [10:00 - 11:00] → Bloqueado
          this.where('start_time', '>=', dateTime)
            .where('start_time', '<', endTime);
        })
        .orWhere(function() {
          // Caso 3: El slot empieza exactamente cuando termina el bloque
          // Bloque: [10:00 - 11:00], Slot: [11:00 - 12:00] → Bloqueado
          this.where('end_time', '=', dateTime);
        });
      })
      .first();

    if (blockedSlot) {
      console.log('❌ Bloqueado por bloque de tiempo');
      return false;
    }
    
    // Buscar citas activas (confirmadas o pendientes de pago) que se solapen con este horario
    // No incluimos cancelled, completed o no_show porque esos horarios están liberados
    let query = db('bookings')
      .whereIn('status', ['confirmed', 'pending_payment'])
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
      });

    // Excluir la cita actual si se está editando
    if (excludeBookingId) {
      query = query.where('id', '!=', excludeBookingId);
    }

    const conflictingBookings = await query.first();
    
    if (conflictingBookings) {
      console.log('❌ Conflicto encontrado:', {
        bookingId: conflictingBookings.id,
        bookingDateTime: conflictingBookings.date_time,
        bookingDuration: conflictingBookings.duration,
        bookingStatus: conflictingBookings.status
      });
    } else {
      console.log('✅ Slot disponible');
    }
    
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
    // Los horarios de negocio están en hora de Chile
    // Crear una fecha en hora local de Chile usando la zona horaria correcta
    const [hours, minutes] = timeString.split(':').map(Number);
    
    // Crear fecha en formato ISO con la fecha base
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hoursStr = String(hours).padStart(2, '0');
    const minutesStr = String(minutes).padStart(2, '0');
    
    // Crear fecha en hora de Chile (America/Santiago maneja automáticamente DST)
    const chileTimeStr = `${year}-${month}-${day}T${hoursStr}:${minutesStr}:00`;
    const result = parseChileDateTime(chileTimeStr);
    
    return result;
  }

  private static formatBooking(dbBooking: any): Booking {
    return {
      id: dbBooking.id,
      clientId: dbBooking.client_id,
      serviceId: dbBooking.service_id,
      professionalId: dbBooking.professional_id,
      box: dbBooking.box,
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
      box: dbBooking.box,
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
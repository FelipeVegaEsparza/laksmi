import db from '../config/database';
import { Professional, CreateProfessionalRequest, UpdateProfessionalRequest, WeeklySchedule } from '../types/booking';

export class ProfessionalModel {
  static async findById(id: string): Promise<Professional | null> {
    const professional = await db('professionals').where({ id }).first();
    if (!professional) return null;
    
    return this.formatProfessional(professional);
  }

  static async findByName(name: string): Promise<Professional | null> {
    const professional = await db('professionals').where({ name }).first();
    if (!professional) return null;
    
    return this.formatProfessional(professional);
  }

  static async create(professionalData: CreateProfessionalRequest): Promise<Professional> {
    const insertData = {
      name: professionalData.name,
      specialties: JSON.stringify(professionalData.specialties),
      schedule: JSON.stringify(professionalData.schedule),
      is_active: professionalData.isActive !== undefined ? professionalData.isActive : true
    };

    await db('professionals').insert(insertData);

    // Buscar el profesional recién creado
    const professional = await db('professionals')
      .where({ name: professionalData.name })
      .first();
    
    if (!professional) {
      throw new Error('Error creating professional');
    }

    return this.formatProfessional(professional);
  }

  static async update(id: string, updates: UpdateProfessionalRequest): Promise<Professional | null> {
    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.specialties !== undefined) updateData.specialties = JSON.stringify(updates.specialties);
    if (updates.schedule !== undefined) updateData.schedule = JSON.stringify(updates.schedule);
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    
    updateData.updated_at = new Date();

    const result = await db('professionals').where({ id }).update(updateData);
    
    if (result === 0) {
      return null;
    }

    return this.findById(id);
  }

  static async findAll(activeOnly: boolean = false): Promise<Professional[]> {
    let query = db('professionals').select('*');
    
    if (activeOnly) {
      query = query.where('is_active', true);
    }
    
    query = query.orderBy('name');
    
    const professionals = await query;
    
    return professionals.map(professional => this.formatProfessional(professional));
  }

  static async delete(id: string): Promise<boolean> {
    const result = await db('professionals').where({ id }).del();
    return result > 0;
  }

  static async findBySpecialty(serviceId: string, activeOnly: boolean = true): Promise<Professional[]> {
    let query = db('professionals')
      .whereRaw('JSON_CONTAINS(specialties, ?)', [`"${serviceId}"`]);
    
    if (activeOnly) {
      query = query.where('is_active', true);
    }
    
    const professionals = await query.orderBy('name');
    
    return professionals.map(professional => this.formatProfessional(professional));
  }

  static async toggleActive(id: string): Promise<Professional | null> {
    const professional = await this.findById(id);
    if (!professional) return null;

    await db('professionals')
      .where({ id })
      .update({ 
        is_active: !professional.isActive,
        updated_at: new Date()
      });

    return this.findById(id);
  }

  static async isAvailableAtTime(professionalId: string, dateTime: Date, duration: number): Promise<boolean> {
    const professional = await this.findById(professionalId);
    if (!professional || !professional.isActive) {
      return false;
    }

    // Verificar si está dentro del horario de trabajo
    const dayOfWeek = this.getDayOfWeek(dateTime);
    const daySchedule = professional.schedule[dayOfWeek];
    
    if (!daySchedule.isWorking) {
      return false;
    }

    const timeString = this.formatTimeString(dateTime);
    const endTime = new Date(dateTime.getTime() + duration * 60000);
    const endTimeString = this.formatTimeString(endTime);

    // Verificar si el horario está dentro de algún turno
    const isWithinShift = daySchedule.shifts.some(shift => {
      return timeString >= shift.startTime && endTimeString <= shift.endTime;
    });

    if (!isWithinShift) {
      return false;
    }

    // Verificar conflictos con citas existentes
    const conflictingBookings = await db('bookings')
      .where('professional_id', professionalId)
      .where('status', 'confirmed')
      .where(function() {
        this.where(function() {
          // La nueva cita empieza durante una cita existente
          this.where('date_time', '<=', dateTime)
            .whereRaw('DATE_ADD(date_time, INTERVAL duration MINUTE) > ?', [dateTime]);
        }).orWhere(function() {
          // La nueva cita termina durante una cita existente
          this.where('date_time', '<', endTime)
            .whereRaw('DATE_ADD(date_time, INTERVAL duration MINUTE) >= ?', [endTime]);
        }).orWhere(function() {
          // La nueva cita engloba una cita existente
          this.where('date_time', '>=', dateTime)
            .whereRaw('DATE_ADD(date_time, INTERVAL duration MINUTE) <= ?', [endTime]);
        });
      });

    return conflictingBookings.length === 0;
  }

  static async getWorkingHours(professionalId: string, date: Date): Promise<import('../types/booking').TimeSlot[]> {
    const professional = await this.findById(professionalId);
    if (!professional || !professional.isActive) {
      return [];
    }

    const dayOfWeek = this.getDayOfWeek(date);
    const daySchedule = professional.schedule[dayOfWeek];
    
    if (!daySchedule.isWorking) {
      return [];
    }

    return daySchedule.shifts;
  }

  private static formatProfessional(dbProfessional: any): Professional {
    return {
      id: dbProfessional.id,
      name: dbProfessional.name,
      specialties: typeof dbProfessional.specialties === 'string' 
        ? JSON.parse(dbProfessional.specialties) 
        : (dbProfessional.specialties || []),
      schedule: typeof dbProfessional.schedule === 'string'
        ? JSON.parse(dbProfessional.schedule)
        : (dbProfessional.schedule || this.getDefaultSchedule()),
      isActive: Boolean(dbProfessional.is_active),
      createdAt: dbProfessional.created_at,
      updatedAt: dbProfessional.updated_at
    };
  }

  private static getDayOfWeek(date: Date): keyof WeeklySchedule {
    const days: (keyof WeeklySchedule)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  }

  private static formatTimeString(date: Date): string {
    return date.toTimeString().slice(0, 5); // "HH:mm"
  }

  private static getDefaultSchedule(): WeeklySchedule {
    const defaultDaySchedule = {
      isWorking: false,
      shifts: []
    };

    return {
      monday: { isWorking: true, shifts: [{ startTime: '09:00', endTime: '18:00' }] },
      tuesday: { isWorking: true, shifts: [{ startTime: '09:00', endTime: '18:00' }] },
      wednesday: { isWorking: true, shifts: [{ startTime: '09:00', endTime: '18:00' }] },
      thursday: { isWorking: true, shifts: [{ startTime: '09:00', endTime: '18:00' }] },
      friday: { isWorking: true, shifts: [{ startTime: '09:00', endTime: '18:00' }] },
      saturday: { isWorking: true, shifts: [{ startTime: '09:00', endTime: '16:00' }] },
      sunday: defaultDaySchedule
    };
  }
}
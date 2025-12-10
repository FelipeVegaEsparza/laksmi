import db from '../config/database';

export interface BlockedTimeSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  reason?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBlockedTimeSlotRequest {
  startTime: Date;
  endTime: Date;
  reason?: string;
  createdBy?: string;
}

export class BlockedTimeSlotModel {
  static async create(data: CreateBlockedTimeSlotRequest): Promise<BlockedTimeSlot> {
    await db('blocked_time_slots').insert({
      start_time: data.startTime,
      end_time: data.endTime,
      reason: data.reason,
      created_by: data.createdBy
    });

    // Buscar el registro recién insertado por tiempo y usuario
    const slot = await db('blocked_time_slots')
      .where({ 
        start_time: data.startTime,
        end_time: data.endTime
      })
      .orderBy('created_at', 'desc')
      .first();
    
    if (!slot) throw new Error('Error creating blocked time slot');
    return this.format(slot);
  }

  static async findById(id: string): Promise<BlockedTimeSlot | null> {
    const slot = await db('blocked_time_slots').where({ id }).first();
    return slot ? this.format(slot) : null;
  }

  static async findAll(): Promise<BlockedTimeSlot[]> {
    const slots = await db('blocked_time_slots')
      .orderBy('start_time', 'asc');
    return slots.map(this.format);
  }

  static async findByDateRange(startDate: Date, endDate: Date): Promise<BlockedTimeSlot[]> {
    const slots = await db('blocked_time_slots')
      .where(function() {
        this.where('start_time', '<=', endDate)
          .where('end_time', '>=', startDate);
      })
      .orderBy('start_time', 'asc');
    
    return slots.map(this.format);
  }

  static async isTimeSlotBlocked(startTime: Date, endTime: Date): Promise<boolean> {
    const blocked = await db('blocked_time_slots')
      .where(function() {
        this.where(function() {
          this.where('start_time', '<=', startTime)
            .where('end_time', '>', startTime);
        }).orWhere(function() {
          this.where('start_time', '<', endTime)
            .where('end_time', '>=', endTime);
        }).orWhere(function() {
          this.where('start_time', '>=', startTime)
            .where('end_time', '<=', endTime);
        });
      })
      .first();

    return !!blocked;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await db('blocked_time_slots').where({ id }).del();
    return result > 0;
  }

  private static format(dbSlot: any): BlockedTimeSlot {
    return {
      id: dbSlot.id,
      startTime: new Date(dbSlot.start_time),
      endTime: new Date(dbSlot.end_time),
      reason: dbSlot.reason,
      createdBy: dbSlot.created_by,
      createdAt: new Date(dbSlot.created_at),
      updatedAt: new Date(dbSlot.updated_at)
    };
  }
}

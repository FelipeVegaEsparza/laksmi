export interface Booking {
  id: string;
  clientId: string;
  serviceId: string;
  professionalId?: string;
  dateTime: Date;
  duration: number; // en minutos
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBookingRequest {
  clientId: string;
  serviceId: string;
  dateTime: Date;
  notes?: string;
  preferredProfessionalId?: string;
}

export interface UpdateBookingRequest {
  dateTime?: Date;
  professionalId?: string;
  status?: 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  notes?: string;
}

export interface BookingFilters {
  clientId?: string;
  professionalId?: string;
  serviceId?: string;
  status?: 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

export interface Professional {
  id: string;
  name: string;
  specialties: string[]; // IDs de servicios que puede realizar
  schedule: WeeklySchedule;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProfessionalRequest {
  name: string;
  specialties: string[];
  schedule: WeeklySchedule;
  isActive?: boolean;
}

export interface UpdateProfessionalRequest {
  name?: string;
  specialties?: string[];
  schedule?: WeeklySchedule;
  isActive?: boolean;
}

export interface WeeklySchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  isWorking: boolean;
  shifts: TimeSlot[];
}

export interface TimeSlot {
  startTime: string; // formato "HH:mm"
  endTime: string;   // formato "HH:mm"
}

export interface AvailabilityRequest {
  serviceId: string;
  dateFrom: Date;
  dateTo: Date;
  preferredProfessionalId?: string;
}

export interface AvailabilitySlot {
  dateTime: Date;
  professionalId: string;
  professionalName: string;
  duration: number;
  available: boolean;
}

export interface AvailabilityResponse {
  serviceId: string;
  serviceName: string;
  serviceDuration: number;
  dateFrom: Date;
  dateTo: Date;
  slots: AvailabilitySlot[];
}

export interface BookingConflict {
  type: 'professional_busy' | 'outside_schedule' | 'service_mismatch' | 'past_date';
  message: string;
  conflictingBooking?: Booking;
}

export interface BookingValidationResult {
  isValid: boolean;
  conflicts: BookingConflict[];
  suggestedAlternatives?: AvailabilitySlot[];
}

export interface BookingStats {
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  noShowBookings: number;
  todayBookings: number;
  upcomingBookings: number;
  revenue: number;
  averageBookingValue: number;
}
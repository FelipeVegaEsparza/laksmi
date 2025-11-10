export interface ScheduledNotification {
  id: string;
  clientId: string;
  bookingId?: string;
  type: NotificationType;
  channel: NotificationChannel;
  scheduledFor: Date;
  status: NotificationStatus;
  templateName: string;
  templateData: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
  errorMessage?: string;
  retryCount: number;
}

export interface CreateNotificationRequest {
  clientId: string;
  bookingId?: string;
  type: NotificationType;
  channel: NotificationChannel;
  scheduledFor: Date;
  templateName: string;
  templateData: Record<string, any>;
}

export interface UpdateNotificationRequest {
  scheduledFor?: Date;
  status?: NotificationStatus;
  templateData?: Record<string, any>;
  errorMessage?: string;
}

export interface NotificationFilters {
  clientId?: string;
  bookingId?: string;
  type?: NotificationType;
  channel?: NotificationChannel;
  status?: NotificationStatus;
  scheduledFrom?: Date;
  scheduledTo?: Date;
  page?: number;
  limit?: number;
}

export type NotificationType = 
  | 'appointment_reminder'
  | 'appointment_confirmation'
  | 'appointment_cancellation'
  | 'follow_up'
  | 'promotion'
  | 'birthday_greeting'
  | 'loyalty_reward';

export type NotificationChannel = 
  | 'whatsapp'
  | 'email'
  | 'sms';

export type NotificationStatus = 
  | 'pending'
  | 'sent'
  | 'failed'
  | 'cancelled';

export interface NotificationTemplate {
  name: string;
  type: NotificationType;
  channel: NotificationChannel;
  subject?: string; // Para email
  content: string;
  variables: string[]; // Variables que acepta la plantilla
  isActive: boolean;
}

export interface NotificationStats {
  totalNotifications: number;
  pendingNotifications: number;
  sentNotifications: number;
  failedNotifications: number;
  successRate: number;
  channelStats: {
    whatsapp: ChannelStats;
    email: ChannelStats;
    sms: ChannelStats;
  };
  typeStats: Record<NotificationType, number>;
}

export interface ChannelStats {
  total: number;
  sent: number;
  failed: number;
  successRate: number;
}

export interface SendNotificationRequest {
  clientId: string;
  channel: NotificationChannel;
  templateName: string;
  templateData: Record<string, any>;
  scheduledFor?: Date; // Si no se especifica, se envía inmediatamente
}

export interface SendNotificationResponse {
  success: boolean;
  notificationId?: string;
  message: string;
  externalId?: string; // ID del proveedor externo (Twilio, etc.)
}

export interface NotificationProvider {
  sendWhatsApp(to: string, message: string, templateName?: string, templateData?: Record<string, any>): Promise<SendNotificationResponse>;
  sendEmail(to: string, subject: string, content: string, templateName?: string, templateData?: Record<string, any>): Promise<SendNotificationResponse>;
  sendSMS(to: string, message: string): Promise<SendNotificationResponse>;
}

export interface ReminderConfig {
  enabled: boolean;
  hoursBeforeAppointment: number;
  channels: NotificationChannel[];
  templateName: string;
  retryAttempts: number;
  retryIntervalMinutes: number;
}

export interface NotificationJob {
  id: string;
  notificationId: string;
  scheduledFor: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  lastAttempt?: Date;
  nextAttempt?: Date;
  error?: string;
}
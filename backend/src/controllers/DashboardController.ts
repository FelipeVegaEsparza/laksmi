import { Request, Response } from 'express';
import db from '../config/database';
import logger from '../utils/logger';

export class DashboardController {
  static async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      let totalClients = 0;
      let todayBookings = 0;
      let activeConversations = 0;
      let monthlyRevenue = 0;
      let conversionRate = 0;

      // Total de clientes
      try {
        const clientsResult = await db('clients').count('* as count').first();
        totalClients = Number(clientsResult?.count) || 0;
      } catch (err) {
        logger.warn('Error counting clients:', err);
      }

      // Citas de hoy
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const bookingsResult = await db('bookings')
          .count('* as count')
          .whereBetween('date_time', [today, tomorrow])
          .whereIn('status', ['pending', 'confirmed'])
          .first();
        todayBookings = Number(bookingsResult?.count) || 0;
      } catch (err) {
        logger.warn('Error counting today bookings:', err);
      }

      // Conversaciones activas
      try {
        const conversationsResult = await db('conversations')
          .count('* as count')
          .where('status', 'active')
          .first();
        activeConversations = Number(conversationsResult?.count) || 0;
      } catch (err) {
        logger.warn('Error counting active conversations:', err);
      }

      // Ingresos del mes
      try {
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const revenueResult = await db('bookings')
          .sum('price as total')
          .whereBetween('date_time', [firstDayOfMonth, lastDayOfMonth])
          .where('status', 'completed')
          .first();
        monthlyRevenue = Number(revenueResult?.total) || 0;
      } catch (err) {
        logger.warn('Error calculating monthly revenue:', err);
      }

      res.json({
        success: true,
        data: {
          totalClients,
          todayBookings,
          activeConversations,
          monthlyRevenue,
          conversionRate,
          averageResponseTime: 0,
        },
      });
    } catch (error: any) {
      logger.error('Get dashboard metrics error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error fetching dashboard metrics',
      });
    }
  }

  static async getRecentBookings(req: Request, res: Response): Promise<void> {
    try {
      const bookings = await db('bookings')
        .select(
          'bookings.*',
          'clients.name as client_name',
          'clients.phone as client_phone',
          'services.name as service_name'
        )
        .leftJoin('clients', 'bookings.client_id', 'clients.id')
        .leftJoin('services', 'bookings.service_id', 'services.id')
        .orderBy('bookings.created_at', 'desc')
        .limit(10);

      const formattedBookings = bookings.map(booking => ({
        id: booking.id,
        dateTime: booking.date_time,
        status: booking.status,
        totalPrice: booking.total_price,
        notes: booking.notes,
        client: {
          id: booking.client_id,
          name: booking.client_name,
          phone: booking.client_phone,
        },
        service: {
          id: booking.service_id,
          name: booking.service_name,
        },
        createdAt: booking.created_at,
      }));

      res.json({
        success: true,
        data: formattedBookings,
      });
    } catch (error: any) {
      logger.error('Get recent bookings error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error fetching recent bookings',
      });
    }
  }

  static async getActiveConversations(req: Request, res: Response): Promise<void> {
    try {
      const conversations = await db('conversations')
        .select(
          'conversations.*',
          'clients.name as client_name',
          'clients.phone as client_phone'
        )
        .leftJoin('clients', 'conversations.client_id', 'clients.id')
        .where('conversations.status', 'active')
        .orWhere('conversations.status', 'escalated')
        .orderBy('conversations.last_activity', 'desc')
        .limit(10);

      const formattedConversations = conversations.map(conv => ({
        id: conv.id,
        channel: conv.channel,
        status: conv.status,
        lastActivity: conv.last_activity,
        client: {
          id: conv.client_id,
          name: conv.client_name,
          phone: conv.client_phone,
        },
        createdAt: conv.created_at,
      }));

      res.json({
        success: true,
        data: formattedConversations,
      });
    } catch (error: any) {
      logger.error('Get active conversations error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error fetching active conversations',
      });
    }
  }
}

import { Request, Response } from 'express';
import { ClientService } from '../services/ClientService';
import { CreateClientRequest, UpdateClientRequest, ClientFilters } from '../types/client';
import { AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';

export class ClientController {
  static async createClient(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const clientData: CreateClientRequest = req.body;
      const client = await ClientService.createClient(clientData);
      
      res.status(201).json({
        success: true,
        message: 'Cliente creado exitosamente',
        data: client
      });
    } catch (error: any) {
      logger.error('Create client error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al crear cliente'
      });
    }
  }

  static async getClients(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filters: ClientFilters = {
        search: req.query.search as string,
        hasEmail: req.query.hasEmail === 'true' ? true : req.query.hasEmail === 'false' ? false : undefined,
        minLoyaltyPoints: req.query.minLoyaltyPoints ? parseInt(req.query.minLoyaltyPoints as string) : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10
      };

      const result = await ClientService.getClients(filters);
      
      res.json({
        success: true,
        message: 'Clientes obtenidos exitosamente',
        data: result
      });
    } catch (error: any) {
      logger.error('Get clients error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener clientes'
      });
    }
  }

  static async getClientById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const client = await ClientService.getClientById(id);
      
      if (!client) {
        res.status(404).json({
          success: false,
          error: 'Cliente no encontrado'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Cliente obtenido exitosamente',
        data: client
      });
    } catch (error: any) {
      logger.error('Get client by ID error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener cliente'
      });
    }
  }

  static async getClientByPhone(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { phone } = req.params;
      const client = await ClientService.getClientByPhone(phone);
      
      if (!client) {
        res.status(404).json({
          success: false,
          error: 'Cliente no encontrado'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Cliente obtenido exitosamente',
        data: client
      });
    } catch (error: any) {
      logger.error('Get client by phone error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener cliente'
      });
    }
  }

  static async updateClient(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates: UpdateClientRequest = req.body;
      
      const client = await ClientService.updateClient(id, updates);
      
      if (!client) {
        res.status(404).json({
          success: false,
          error: 'Cliente no encontrado'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Cliente actualizado exitosamente',
        data: client
      });
    } catch (error: any) {
      logger.error('Update client error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al actualizar cliente'
      });
    }
  }

  static async deleteClient(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await ClientService.deleteClient(id);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Cliente no encontrado'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Cliente eliminado exitosamente'
      });
    } catch (error: any) {
      logger.error('Delete client error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al eliminar cliente'
      });
    }
  }

  static async addLoyaltyPoints(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { points } = req.body;
      
      const client = await ClientService.addLoyaltyPoints(id, points);
      
      if (!client) {
        res.status(404).json({
          success: false,
          error: 'Cliente no encontrado'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Puntos de lealtad agregados exitosamente',
        data: client
      });
    } catch (error: any) {
      logger.error('Add loyalty points error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al agregar puntos de lealtad'
      });
    }
  }

  static async subtractLoyaltyPoints(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { points } = req.body;
      
      const client = await ClientService.subtractLoyaltyPoints(id, points);
      
      if (!client) {
        res.status(404).json({
          success: false,
          error: 'Cliente no encontrado'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Puntos de lealtad descontados exitosamente',
        data: client
      });
    } catch (error: any) {
      logger.error('Subtract loyalty points error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al descontar puntos de lealtad'
      });
    }
  }

  static async getClientStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = await ClientService.getClientStats();
      
      res.json({
        success: true,
        message: 'Estadísticas de clientes obtenidas exitosamente',
        data: stats
      });
    } catch (error: any) {
      logger.error('Get client stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener estadísticas'
      });
    }
  }

  static async searchClients(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { q } = req.query;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      if (!q || typeof q !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Parámetro de búsqueda requerido'
        });
        return;
      }

      const clients = await ClientService.searchClients(q, limit);
      
      res.json({
        success: true,
        message: 'Búsqueda completada exitosamente',
        data: clients
      });
    } catch (error: any) {
      logger.error('Search clients error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error en la búsqueda'
      });
    }
  }
}
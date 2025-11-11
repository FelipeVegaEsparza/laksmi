import { Request, Response } from 'express';
import { ServiceService } from '../services/ServiceService';
import { CreateServiceRequest, UpdateServiceRequest, ServiceFilters } from '../types/service';
import { AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';
import { processImageUrls, processArrayImageUrls, decodeImageUrls } from '../utils/imageHelper';

export class ServiceController {
  static async createService(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const serviceData: CreateServiceRequest = req.body;
      
      // Clean image URLs before saving
      if (serviceData.images) {
        serviceData.images = decodeImageUrls(serviceData.images);
      }
      
      const service = await ServiceService.createService(serviceData);
      
      res.status(201).json({
        success: true,
        message: 'Servicio creado exitosamente',
        data: processImageUrls(service)
      });
    } catch (error: any) {
      logger.error('Create service error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al crear servicio'
      });
    }
  }

  static async getServices(req: Request, res: Response): Promise<void> {
    try {
      const filters: ServiceFilters = {
        category: req.query.category as string,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        minDuration: req.query.minDuration ? parseInt(req.query.minDuration as string) : undefined,
        maxDuration: req.query.maxDuration ? parseInt(req.query.maxDuration as string) : undefined,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10
      };

      const result = await ServiceService.getServices(filters);
      
      // Clean image URLs in response
      const cleanedResult = {
        ...result,
        services: processArrayImageUrls(result.services)
      };
      
      res.json({
        success: true,
        message: 'Servicios obtenidos exitosamente',
        data: cleanedResult
      });
    } catch (error: any) {
      logger.error('Get services error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener servicios'
      });
    }
  }

  static async getActiveServices(req: Request, res: Response): Promise<void> {
    try {
      const filters: Omit<ServiceFilters, 'isActive'> = {
        category: req.query.category as string,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        minDuration: req.query.minDuration ? parseInt(req.query.minDuration as string) : undefined,
        maxDuration: req.query.maxDuration ? parseInt(req.query.maxDuration as string) : undefined,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10
      };

      const result = await ServiceService.getActiveServices(filters);
      
      // Clean image URLs in response
      const cleanedResult = {
        ...result,
        services: processArrayImageUrls(result.services)
      };
      
      res.json({
        success: true,
        message: 'Servicios activos obtenidos exitosamente',
        data: cleanedResult
      });
    } catch (error: any) {
      logger.error('Get active services error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener servicios activos'
      });
    }
  }

  static async getServiceById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const service = await ServiceService.getServiceById(id);
      
      if (!service) {
        res.status(404).json({
          success: false,
          error: 'Servicio no encontrado'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Servicio obtenido exitosamente',
        data: processImageUrls(service)
      });
    } catch (error: any) {
      logger.error('Get service by ID error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener servicio'
      });
    }
  }

  static async updateService(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates: UpdateServiceRequest = req.body;
      
      // Clean image URLs before saving
      if (updates.images) {
        updates.images = decodeImageUrls(updates.images);
      }
      
      const service = await ServiceService.updateService(id, updates);
      
      if (!service) {
        res.status(404).json({
          success: false,
          error: 'Servicio no encontrado'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Servicio actualizado exitosamente',
        data: processImageUrls(service)
      });
    } catch (error: any) {
      logger.error('Update service error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al actualizar servicio'
      });
    }
  }

  static async deleteService(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await ServiceService.deleteService(id);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Servicio no encontrado'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Servicio eliminado exitosamente'
      });
    } catch (error: any) {
      logger.error('Delete service error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al eliminar servicio'
      });
    }
  }

  static async getServicesByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.params;
      const services = await ServiceService.getServicesByCategory(category);
      
      res.json({
        success: true,
        message: 'Servicios por categoría obtenidos exitosamente',
        data: services
      });
    } catch (error: any) {
      logger.error('Get services by category error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener servicios por categoría'
      });
    }
  }

  static async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await ServiceService.getCategories();
      
      res.json({
        success: true,
        message: 'Categorías obtenidas exitosamente',
        data: categories
      });
    } catch (error: any) {
      logger.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener categorías'
      });
    }
  }

  static async getPopularServices(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const services = await ServiceService.getPopularServices(limit);
      
      res.json({
        success: true,
        message: 'Servicios populares obtenidos exitosamente',
        data: services
      });
    } catch (error: any) {
      logger.error('Get popular services error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener servicios populares'
      });
    }
  }

  static async getServiceStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = await ServiceService.getServiceStats();
      
      res.json({
        success: true,
        message: 'Estadísticas de servicios obtenidas exitosamente',
        data: stats
      });
    } catch (error: any) {
      logger.error('Get service stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener estadísticas'
      });
    }
  }

  static async toggleServiceStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const service = await ServiceService.toggleServiceStatus(id);
      
      if (!service) {
        res.status(404).json({
          success: false,
          error: 'Servicio no encontrado'
        });
        return;
      }

      res.json({
        success: true,
        message: `Servicio ${service.isActive ? 'activado' : 'desactivado'} exitosamente`,
        data: service
      });
    } catch (error: any) {
      logger.error('Toggle service status error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al cambiar estado del servicio'
      });
    }
  }

  static async searchServices(req: Request, res: Response): Promise<void> {
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

      const services = await ServiceService.searchServices(q, limit);
      
      res.json({
        success: true,
        message: 'Búsqueda completada exitosamente',
        data: services
      });
    } catch (error: any) {
      logger.error('Search services error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error en la búsqueda'
      });
    }
  }
}
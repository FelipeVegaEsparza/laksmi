import { ServiceModel } from '../models/Service';
import { CreateServiceRequest, UpdateServiceRequest, ServiceFilters, Service } from '../types/service';
import logger from '../utils/logger';

export class ServiceService {
  static async createService(serviceData: CreateServiceRequest): Promise<Service> {
    // Verificar que el nombre no exista
    const existingService = await ServiceModel.findByName(serviceData.name);
    if (existingService) {
      throw new Error('Ya existe un servicio con este nombre');
    }

    const service = await ServiceModel.create(serviceData);
    logger.info(`New service created: ${service.name} (${service.category})`);
    
    return service;
  }

  static async getServiceById(id: string): Promise<Service | null> {
    return ServiceModel.findById(id);
  }

  static async updateService(id: string, updates: UpdateServiceRequest): Promise<Service | null> {
    const existingService = await ServiceModel.findById(id);
    if (!existingService) {
      throw new Error('Servicio no encontrado');
    }

    // Verificar que el nombre no exista en otro servicio (si se está actualizando)
    if (updates.name && updates.name !== existingService.name) {
      const existingName = await ServiceModel.findByName(updates.name);
      if (existingName && existingName.id !== id) {
        throw new Error('Ya existe otro servicio con este nombre');
      }
    }

    const updatedService = await ServiceModel.update(id, updates);
    if (updatedService) {
      logger.info(`Service updated: ${updatedService.name} (${updatedService.category})`);
    }
    
    return updatedService;
  }

  static async deleteService(id: string): Promise<boolean> {
    const service = await ServiceModel.findById(id);
    if (!service) {
      throw new Error('Servicio no encontrado');
    }

    // Soft delete: marcar como inactivo
    const deleted = await ServiceModel.delete(id);
    if (deleted) {
      logger.info(`Service soft-deleted (marked as inactive): ${service.name} (${service.category})`);
    }
    
    return deleted;
  }

  static async getServices(filters: ServiceFilters = {}) {
    const { services, total } = await ServiceModel.findAll(filters);
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const totalPages = Math.ceil(total / limit);

    return {
      services,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  static async getActiveServices(filters: Omit<ServiceFilters, 'isActive'> = {}) {
    return this.getServices({ ...filters, isActive: true });
  }

  static async getServicesByCategory(category: string): Promise<Service[]> {
    return ServiceModel.getServicesByCategory(category);
  }

  static async getCategories() {
    return ServiceModel.getCategories();
  }

  static async getPopularServices(limit: number = 10): Promise<Service[]> {
    return ServiceModel.getPopularServices(limit);
  }

  static async getServiceStats() {
    return ServiceModel.getServiceStats();
  }

  static async toggleServiceStatus(id: string): Promise<Service | null> {
    const service = await ServiceModel.findById(id);
    if (!service) {
      throw new Error('Servicio no encontrado');
    }

    const updatedService = await ServiceModel.toggleActive(id);
    if (updatedService) {
      const status = updatedService.isActive ? 'activated' : 'deactivated';
      logger.info(`Service ${status}: ${updatedService.name}`);
    }
    
    return updatedService;
  }

  static async searchServices(searchTerm: string, limit: number = 10): Promise<Service[]> {
    const { services } = await ServiceModel.findAll({
      search: searchTerm,
      isActive: true,
      limit
    });
    
    return services;
  }

  static async getServicesByPriceRange(minPrice: number, maxPrice: number): Promise<Service[]> {
    const { services } = await ServiceModel.findAll({
      minPrice,
      maxPrice,
      isActive: true
    });
    
    return services;
  }

  static async getServicesByDuration(minDuration: number, maxDuration: number): Promise<Service[]> {
    const { services } = await ServiceModel.findAll({
      minDuration,
      maxDuration,
      isActive: true
    });
    
    return services;
  }
}
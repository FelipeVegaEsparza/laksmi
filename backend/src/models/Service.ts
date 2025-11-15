import db from '../config/database';
import { Service, CreateServiceRequest, UpdateServiceRequest, ServiceFilters, ServiceCategory } from '../types/service';

export class ServiceModel {
  static async findById(id: string): Promise<Service | null> {
    const service = await db('services').where({ id }).first();
    if (!service) return null;
    
    return this.formatService(service);
  }

  static async findByName(name: string): Promise<Service | null> {
    const service = await db('services').where({ name }).first();
    if (!service) return null;
    
    return this.formatService(service);
  }

  static async create(serviceData: CreateServiceRequest): Promise<Service> {
    const insertData = {
      name: serviceData.name,
      category: serviceData.category,
      price: serviceData.price,
      duration: serviceData.duration,
      description: serviceData.description || null,
      benefits: serviceData.benefits || null,
      images: JSON.stringify(serviceData.images || []),
      requirements: JSON.stringify(serviceData.requirements || []),
      is_active: serviceData.isActive !== undefined ? serviceData.isActive : true,
      sessions: serviceData.sessions || 1,
      tag: serviceData.tag || null
    };

    // DEBUG: Ver qué se va a guardar en la BD
    console.log('💾 ServiceModel - Guardando en BD:');
    console.log('   Description preview:', insertData.description?.substring(0, 200));
    console.log('   Benefits preview:', insertData.benefits?.substring(0, 200));
    console.log('   Description tiene HTML?:', insertData.description?.includes('<'));
    console.log('   Benefits tiene HTML?:', insertData.benefits?.includes('<'));

    await db('services').insert(insertData);

    // Buscar el servicio recién creado
    const service = await db('services')
      .where({ name: serviceData.name })
      .first();
    
    if (!service) {
      throw new Error('Error creating service');
    }

    return this.formatService(service);
  }

  static async update(id: string, updates: UpdateServiceRequest): Promise<Service | null> {
    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.price !== undefined) updateData.price = updates.price;
    if (updates.duration !== undefined) updateData.duration = updates.duration;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.benefits !== undefined) updateData.benefits = updates.benefits;
    if (updates.images !== undefined) updateData.images = JSON.stringify(updates.images);
    if (updates.requirements !== undefined) updateData.requirements = JSON.stringify(updates.requirements);
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.sessions !== undefined) updateData.sessions = updates.sessions;
    if (updates.tag !== undefined) updateData.tag = updates.tag;
    
    updateData.updated_at = new Date();

    const result = await db('services').where({ id }).update(updateData);
    
    if (result === 0) {
      return null;
    }

    return this.findById(id);
  }

  static async findAll(filters: ServiceFilters = {}): Promise<{ services: Service[]; total: number }> {
    const { 
      category, 
      minPrice, 
      maxPrice, 
      minDuration, 
      maxDuration, 
      isActive, 
      search, 
      page = 1, 
      limit = 10 
    } = filters;
    
    let query = db('services').select('*');

    // Aplicar filtros
    if (category) {
      query = query.where('category', category);
    }

    if (minPrice !== undefined) {
      query = query.where('price', '>=', minPrice);
    }

    if (maxPrice !== undefined) {
      query = query.where('price', '<=', maxPrice);
    }

    if (minDuration !== undefined) {
      query = query.where('duration', '>=', minDuration);
    }

    if (maxDuration !== undefined) {
      query = query.where('duration', '<=', maxDuration);
    }

    if (isActive !== undefined) {
      query = query.where('is_active', isActive);
    }

    if (search) {
      query = query.where(function() {
        this.where('name', 'like', `%${search}%`)
          .orWhere('description', 'like', `%${search}%`)
          .orWhere('category', 'like', `%${search}%`);
      });
    }

    // Contar total de registros
    const countQuery = query.clone();
    const [{ count }] = await countQuery.count('* as count');
    const total = parseInt(count as string);

    // Aplicar paginación
    const offset = (page - 1) * limit;
    query = query.limit(limit).offset(offset).orderBy('created_at', 'desc');

    const services = await query;
    
    return {
      services: services.map(service => this.formatService(service)),
      total
    };
  }

  static async delete(id: string): Promise<boolean> {
    // Soft delete: marcar como inactivo en lugar de borrar
    const result = await db('services')
      .where({ id })
      .update({ 
        is_active: false,
        updated_at: new Date()
      });
    return result > 0;
  }

  static async getCategories(): Promise<ServiceCategory[]> {
    const categories = await db('services')
      .select('category')
      .count('* as serviceCount')
      .groupBy('category')
      .orderBy('serviceCount', 'desc');

    return categories.map(cat => ({
      name: String(cat.category),
      description: `Servicios de ${String(cat.category).toLowerCase()}`,
      serviceCount: parseInt(cat.serviceCount as string)
    }));
  }

  static async getServicesByCategory(category: string): Promise<Service[]> {
    const services = await db('services')
      .where({ category, is_active: true })
      .orderBy('name');

    return services.map(service => this.formatService(service));
  }

  static async getPopularServices(limit: number = 10): Promise<Service[]> {
    // En una implementación completa, esto se basaría en estadísticas de reservas
    const services = await db('services')
      .where({ is_active: true })
      .orderBy('created_at', 'desc')
      .limit(limit);

    return services.map(service => this.formatService(service));
  }

  static async getServiceStats(): Promise<{
    totalServices: number;
    activeServices: number;
    categoriesCount: number;
    averagePrice: number;
    averageDuration: number;
    popularCategories: ServiceCategory[];
  }> {
    const [totalResult] = await db('services').count('* as count');
    const totalServices = parseInt(totalResult.count as string);

    const [activeResult] = await db('services')
      .where('is_active', true)
      .count('* as count');
    const activeServices = parseInt(activeResult.count as string);

    const [categoriesResult] = await db('services')
      .countDistinct('category as count');
    const categoriesCount = parseInt(categoriesResult.count as string);

    const [avgPriceResult] = await db('services')
      .where('is_active', true)
      .avg('price as avg');
    const averagePrice = parseFloat(avgPriceResult.avg as string) || 0;

    const [avgDurationResult] = await db('services')
      .where('is_active', true)
      .avg('duration as avg');
    const averageDuration = parseFloat(avgDurationResult.avg as string) || 0;

    const popularCategories = await this.getCategories();

    return {
      totalServices,
      activeServices,
      categoriesCount,
      averagePrice,
      averageDuration,
      popularCategories: popularCategories.slice(0, 5)
    };
  }

  static async toggleActive(id: string): Promise<Service | null> {
    const service = await this.findById(id);
    if (!service) return null;

    await db('services')
      .where({ id })
      .update({ 
        is_active: !service.isActive,
        updated_at: new Date()
      });

    return this.findById(id);
  }

  private static formatService(dbService: any): Service {
    return {
      id: dbService.id,
      name: dbService.name,
      category: dbService.category,
      price: parseFloat(dbService.price),
      duration: dbService.duration,
      description: dbService.description,
      benefits: dbService.benefits || null,
      images: Array.isArray(dbService.images) ? dbService.images : (dbService.images ? JSON.parse(dbService.images) : []),
      requirements: Array.isArray(dbService.requirements) ? dbService.requirements : (dbService.requirements ? JSON.parse(dbService.requirements) : []),
      isActive: Boolean(dbService.is_active),
      sessions: dbService.sessions || 1,
      tag: dbService.tag || null,
      createdAt: dbService.created_at,
      updatedAt: dbService.updated_at
    };
  }
}
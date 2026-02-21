import db from '../config/database';
import { Service, CreateServiceRequest, UpdateServiceRequest, ServiceFilters, ServiceCategory } from '../types/service';
import { generateUniqueSlug } from '../utils/slug';
import logger from '../utils/logger';

export class ServiceModel {
  static async findById(idOrSlug: string): Promise<Service | null> {
      // Intentar buscar por UUID primero, luego por slug
      let service = await db('services').where({ id: idOrSlug }).first();

      // Si no se encuentra por ID, buscar por slug
      if (!service) {
        service = await db('services').where({ slug: idOrSlug }).first();
      }

      if (!service) return null;

      return await this.formatService(service);
    }


  static async findByName(name: string): Promise<Service | null> {
    const service = await db('services').where({ name }).first();
    if (!service) return null;
    
    return await this.formatService(service);
  }

  static async create(serviceData: CreateServiceRequest): Promise<Service> {
    // Generar slug único
    const slug = await generateUniqueSlug(
      serviceData.name,
      async (slug) => {
        const existing = await db('services').where({ slug }).first();
        return !!existing;
      }
    );

    const insertData = {
      name: serviceData.name,
      slug: slug,
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
    console.log('   Slug:', slug);
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

    // Insertar categorías en la tabla de unión
    const categories = serviceData.categories || [serviceData.category];
    const uniqueCategories = Array.from(new Set(categories)); // Eliminar duplicados

    const categoryInserts = uniqueCategories.map((categoryName, index) => ({
      id: db.raw('UUID()'),
      service_id: service.id,
      category_name: categoryName,
      is_primary: index === 0, // La primera es la primaria
      display_order: index
    }));

    await db('service_categories').insert(categoryInserts);

    return await this.formatService(service);
  }

  static async update(id: string, updates: UpdateServiceRequest): Promise<Service | null> {
    const updateData: any = {};
    
    if (updates.name !== undefined) {
      updateData.name = updates.name;
      // Regenerar slug si cambia el nombre
      updateData.slug = await generateUniqueSlug(
        updates.name,
        async (slug) => {
          const existing = await db('services').where({ slug }).whereNot({ id }).first();
          return !!existing;
        }
      );
    }
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
    if (updates.is_featured !== undefined) {
      updateData.is_featured = updates.is_featured ? 1 : 0;
    }
    
    updateData.updated_at = new Date();

    const result = await db('services').where({ id }).update(updateData);
    
    if (result === 0) {
      return null;
    }

    // Si se proporcionan categorías, actualizarlas
    if (updates.categories !== undefined) {
      await this.updateCategories(id, updates.categories);
    } else if (updates.category !== undefined) {
      // Si solo se actualiza la categoría primaria, actualizar en la tabla de unión
      await this.setPrimaryCategory(id, updates.category);
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
      // Buscar servicios que tengan esta categoría (primaria o secundaria)
      const serviceIds = await db('service_categories')
        .where({ category_name: category })
        .select('service_id');
      
      if (serviceIds.length > 0) {
        const ids = serviceIds.map(s => s.service_id);
        query = query.whereIn('id', ids);
      } else {
        // Si no hay servicios con esta categoría, retornar vacío
        query = query.where('id', null);
      }
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
    
    // Formatear servicios con sus categorías
    const formattedServices = await Promise.all(
      services.map(service => this.formatService(service))
    );
    
    return {
      services: formattedServices,
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
    try {
      logger.info('🔍 Getting categories - attempting from service_categories first');
      
      // OPCIÓN 1: Intentar desde service_categories (tabla de unión)
      try {
        const categoriesFromJunction = await db('service_categories')
          .join('services', 'service_categories.service_id', 'services.id')
          .where('services.is_active', true)
          .select('service_categories.category_name')
          .count('DISTINCT service_categories.service_id as serviceCount')
          .groupBy('service_categories.category_name')
          .orderBy('serviceCount', 'desc');

        logger.info('📊 Categories from junction table:', {
          count: categoriesFromJunction.length,
          categories: categoriesFromJunction
        });

        if (categoriesFromJunction.length > 0) {
          return categoriesFromJunction.map(cat => ({
            name: String(cat.category_name),
            description: `Servicios de ${String(cat.category_name).toLowerCase()}`,
            serviceCount: parseInt(cat.serviceCount as string)
          }));
        }
      } catch (junctionError) {
        logger.warn('⚠️ Error querying service_categories table (might not exist):', junctionError);
      }

      // OPCIÓN 2: Si no hay datos en service_categories, obtener desde la columna category de services
      logger.warn('⚠️ No categories found in service_categories, falling back to services.category column');
      
      const categoriesFromServices = await db('services')
        .where('is_active', true)
        .whereNotNull('category')
        .where('category', '!=', '')
        .select('category')
        .count('* as serviceCount')
        .groupBy('category')
        .orderBy('serviceCount', 'desc');

      logger.info('📊 Categories from services table (active only):', {
        count: categoriesFromServices.length,
        categories: categoriesFromServices
      });

      if (categoriesFromServices.length > 0) {
        return categoriesFromServices.map(cat => ({
          name: String(cat.category),
          description: `Servicios de ${String(cat.category).toLowerCase()}`,
          serviceCount: parseInt(cat.serviceCount as string)
        }));
      }

      // OPCIÓN 3: Si tampoco hay en services activos, intentar sin filtro de is_active
      logger.warn('⚠️ No active categories found, trying without is_active filter');
      
      const allCategories = await db('services')
        .whereNotNull('category')
        .where('category', '!=', '')
        .select('category')
        .count('* as serviceCount')
        .groupBy('category')
        .orderBy('serviceCount', 'desc');

      logger.info('📊 All categories (no filter):', {
        count: allCategories.length,
        categories: allCategories
      });

      if (allCategories.length > 0) {
        return allCategories.map(cat => ({
          name: String(cat.category),
          description: `Servicios de ${String(cat.category).toLowerCase()}`,
          serviceCount: parseInt(cat.serviceCount as string)
        }));
      }

      // OPCIÓN 4: Si aún no hay categorías, devolver categorías por defecto
      logger.error('❌ No categories found in database, returning default categories');
      return [
        { name: 'Depilación', description: 'Servicios de depilación', serviceCount: 0 },
        { name: 'Tratamientos Faciales', description: 'Servicios de tratamientos faciales', serviceCount: 0 },
        { name: 'Tratamientos Corporales', description: 'Servicios de tratamientos corporales', serviceCount: 0 }
      ];
    } catch (error) {
      logger.error('❌ Error getting categories:', error);
      // Devolver categorías por defecto en caso de error
      return [
        { name: 'Depilación', description: 'Servicios de depilación', serviceCount: 0 },
        { name: 'Tratamientos Faciales', description: 'Servicios de tratamientos faciales', serviceCount: 0 },
        { name: 'Tratamientos Corporales', description: 'Servicios de tratamientos corporales', serviceCount: 0 }
      ];
    }
  }

  static async getServicesByCategory(category: string): Promise<Service[]> {
    // Buscar servicios que tengan esta categoría (primaria o secundaria)
    const serviceIds = await db('service_categories')
      .where({ category_name: category })
      .select('service_id');

    if (serviceIds.length === 0) {
      return [];
    }

    const ids = serviceIds.map(s => s.service_id);
    const services = await db('services')
      .whereIn('id', ids)
      .where({ is_active: true })
      .orderBy('name');

    return await Promise.all(services.map(service => this.formatService(service)));
  }

  static async getPopularServices(limit: number = 10): Promise<Service[]> {
    // En una implementación completa, esto se basaría en estadísticas de reservas
    const services = await db('services')
      .where({ is_active: true })
      .orderBy('created_at', 'desc')
      .limit(limit);

    return await Promise.all(services.map(service => this.formatService(service)));
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

  // ============================================
  // MÉTODOS DE GESTIÓN DE CATEGORÍAS MÚLTIPLES
  // ============================================

  /**
   * Agregar una categoría a un servicio
   * @param serviceId ID del servicio
   * @param categoryName Nombre de la categoría
   * @param isPrimary Si es la categoría primaria
   */
  static async addCategory(serviceId: string, categoryName: string, isPrimary: boolean = false): Promise<void> {
    // Verificar que el servicio existe
    const service = await this.findById(serviceId);
    if (!service) {
      throw new Error('Service not found');
    }

    // Verificar si la categoría ya está asignada
    const existing = await db('service_categories')
      .where({ service_id: serviceId, category_name: categoryName })
      .first();

    if (existing) {
      throw new Error(`Category '${categoryName}' is already assigned to this service`);
    }

    // Si es primaria, desmarcar otras categorías primarias
    if (isPrimary) {
      await db('service_categories')
        .where({ service_id: serviceId, is_primary: true })
        .update({ is_primary: false });
    }

    // Obtener el siguiente display_order
    const [maxOrder] = await db('service_categories')
      .where({ service_id: serviceId })
      .max('display_order as max');
    const displayOrder = (maxOrder.max || -1) + 1;

    // Insertar la nueva categoría
    await db('service_categories').insert({
      id: db.raw('UUID()'),
      service_id: serviceId,
      category_name: categoryName,
      is_primary: isPrimary,
      display_order: displayOrder
    });

    // Si es primaria, actualizar la columna category en services (el trigger lo hace automáticamente)
  }

  /**
   * Remover una categoría de un servicio
   * @param serviceId ID del servicio
   * @param categoryName Nombre de la categoría a remover
   */
  static async removeCategory(serviceId: string, categoryName: string): Promise<void> {
    // Verificar que el servicio existe
    const service = await this.findById(serviceId);
    if (!service) {
      throw new Error('Service not found');
    }

    // Verificar que la categoría está asignada
    const category = await db('service_categories')
      .where({ service_id: serviceId, category_name: categoryName })
      .first();

    if (!category) {
      throw new Error(`Category '${categoryName}' is not assigned to this service`);
    }

    // Verificar que no es la última categoría
    const [count] = await db('service_categories')
      .where({ service_id: serviceId })
      .count('* as count');

    if (parseInt(count.count as string) <= 1) {
      throw new Error('Cannot remove the last category. Service must have at least one category.');
    }

    const wasPrimary = category.is_primary;

    // Eliminar la categoría
    await db('service_categories')
      .where({ service_id: serviceId, category_name: categoryName })
      .del();

    // Si era primaria, asignar otra categoría como primaria
    if (wasPrimary) {
      const [firstCategory] = await db('service_categories')
        .where({ service_id: serviceId })
        .orderBy('display_order', 'asc')
        .limit(1);

      if (firstCategory) {
        await db('service_categories')
          .where({ id: firstCategory.id })
          .update({ is_primary: true });
      }
    }
  }

  /**
   * Obtener todas las categorías de un servicio
   * @param serviceId ID del servicio
   * @returns Array de nombres de categorías ordenadas por display_order
   */
  static async getCategoriesForService(serviceId: string): Promise<string[]> {
    const categories = await db('service_categories')
      .where({ service_id: serviceId })
      .orderBy('display_order', 'asc')
      .select('category_name');

    return categories.map(cat => cat.category_name);
  }

  /**
   * Actualizar todas las categorías de un servicio
   * @param serviceId ID del servicio
   * @param categories Array de nombres de categorías (la primera será la primaria)
   */
  static async updateCategories(serviceId: string, categories: string[]): Promise<void> {
    console.log('🔍 ServiceModel.updateCategories - Iniciando:', { serviceId, categories });

    // Validar que hay al menos una categoría
    if (!categories || categories.length === 0) {
      throw new Error('At least one category must be provided');
    }

    // Verificar que el servicio existe
    const service = await this.findById(serviceId);
    if (!service) {
      throw new Error('Service not found');
    }

    // Eliminar categorías duplicadas
    const uniqueCategories = Array.from(new Set(categories));
    console.log('✅ Categorías únicas:', uniqueCategories);

    // Eliminar todas las categorías existentes
    const deleted = await db('service_categories')
      .where({ service_id: serviceId })
      .del();
    console.log(`🗑️ Categorías eliminadas: ${deleted}`);

    // Insertar las nuevas categorías
    const insertData = uniqueCategories.map((categoryName, index) => ({
      id: db.raw('UUID()'),
      service_id: serviceId,
      category_name: categoryName,
      is_primary: index === 0, // La primera es la primaria
      display_order: index
    }));

    console.log('📝 Datos a insertar:', insertData);
    await db('service_categories').insert(insertData);
    console.log('✅ Categorías insertadas exitosamente');

    // Actualizar la columna category en services con la categoría primaria
    await db('services')
      .where({ id: serviceId })
      .update({ category: uniqueCategories[0] });
    console.log('✅ Categoría primaria actualizada en services');
  }

  /**
   * Establecer una categoría como primaria
   * @param serviceId ID del servicio
   * @param categoryName Nombre de la categoría a establecer como primaria
   */
  static async setPrimaryCategory(serviceId: string, categoryName: string): Promise<void> {
    // Verificar que el servicio existe
    const service = await this.findById(serviceId);
    if (!service) {
      throw new Error('Service not found');
    }

    // Verificar que la categoría está asignada
    const category = await db('service_categories')
      .where({ service_id: serviceId, category_name: categoryName })
      .first();

    if (!category) {
      throw new Error(`Category '${categoryName}' is not assigned to this service`);
    }

    // Desmarcar todas las categorías primarias
    await db('service_categories')
      .where({ service_id: serviceId })
      .update({ is_primary: false });

    // Marcar la nueva categoría como primaria
    await db('service_categories')
      .where({ service_id: serviceId, category_name: categoryName })
      .update({ is_primary: true });

    // Actualizar la columna category en services (el trigger lo hace automáticamente)
  }

  private static async formatService(dbService: any): Promise<Service> {
    // Obtener todas las categorías del servicio desde la tabla de unión
    const categories = await db('service_categories')
      .where({ service_id: dbService.id })
      .orderBy('display_order', 'asc')
      .select('category_name');

    const categoryNames = categories.map(c => c.category_name);
    
    console.log('🔍 formatService - Categorías encontradas:', {
      serviceId: dbService.id,
      serviceName: dbService.name,
      categoriesFromJunction: categoryNames,
      primaryCategory: dbService.category
    });

    return {
      id: dbService.id,
      name: dbService.name,
      slug: dbService.slug,
      category: dbService.category, // Categoría primaria para backward compatibility
      categories: categoryNames.length > 0 ? categoryNames : [dbService.category], // Usar categorías de la tabla de unión o fallback
      price: parseFloat(dbService.price),
      duration: dbService.duration,
      description: dbService.description,
      benefits: dbService.benefits || null,
      images: Array.isArray(dbService.images) ? dbService.images : (dbService.images ? JSON.parse(dbService.images) : []),
      requirements: Array.isArray(dbService.requirements) ? dbService.requirements : (dbService.requirements ? JSON.parse(dbService.requirements) : []),
      isActive: Boolean(dbService.is_active),
      sessions: dbService.sessions || 1,
      tag: dbService.tag || null,
      is_featured: Boolean(dbService.is_featured),
      createdAt: dbService.created_at,
      updatedAt: dbService.updated_at
    };
  }
}
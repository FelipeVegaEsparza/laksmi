import db from '../config/database';
import { Product, CreateProductRequest, UpdateProductRequest, ProductFilters, StockMovement, ProductStats, LowStockAlert } from '../types/product';

export class ProductModel {
  static async findById(id: string): Promise<Product | null> {
    const product = await db('products').where({ id }).first();
    if (!product) return null;
    
    return await this.formatProduct(product);
  }

  static async findByName(name: string): Promise<Product | null> {
    const product = await db('products').where({ name }).first();
    if (!product) return null;
    
    return await this.formatProduct(product);
  }

  static async create(productData: CreateProductRequest): Promise<Product> {
    const insertData = {
      name: productData.name,
      category: productData.category,
      price: productData.price,
      payment_link: productData.paymentLink || null,
      stock: productData.stock,
      min_stock: productData.minStock || 5,
      description: productData.description || null,
      benefits: productData.benefits || null,
      images: JSON.stringify(productData.images || []),
      ingredients: JSON.stringify(productData.ingredients || []),
      compatible_services: JSON.stringify(productData.compatibleServices || [])
    };

    await db('products').insert(insertData);

    // Buscar el producto recién creado
    const product = await db('products')
      .where({ name: productData.name })
      .first();
    
    if (!product) {
      throw new Error('Error creating product');
    }

    // Registrar movimiento inicial de stock
    await this.recordStockMovement(product.id, 'in', productData.stock, 'Stock inicial');

    // Insertar categorías en la tabla de unión
    const categories = productData.categories || [productData.category];
    const uniqueCategories = Array.from(new Set(categories)); // Eliminar duplicados

    const categoryInserts = uniqueCategories.map((categoryName, index) => ({
      id: db.raw('UUID()'),
      product_id: product.id,
      category_name: categoryName,
      is_primary: index === 0, // La primera es la primaria
      display_order: index
    }));

    await db('product_categories').insert(categoryInserts);

    return await this.formatProduct(product);
  }

  static async update(id: string, updates: UpdateProductRequest): Promise<Product | null> {
    console.log('🔍 ProductModel.update - Datos recibidos:', {
      id,
      categories: updates.categories,
      category: updates.category
    });

    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.price !== undefined) updateData.price = updates.price;
    if (updates.paymentLink !== undefined) updateData.payment_link = updates.paymentLink;
    if (updates.stock !== undefined) updateData.stock = updates.stock;
    if (updates.minStock !== undefined) updateData.min_stock = updates.minStock;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.benefits !== undefined) updateData.benefits = updates.benefits;
    if (updates.images !== undefined) updateData.images = JSON.stringify(updates.images);
    if (updates.ingredients !== undefined) updateData.ingredients = JSON.stringify(updates.ingredients);
    if (updates.compatibleServices !== undefined) updateData.compatible_services = JSON.stringify(updates.compatibleServices);
    
    updateData.updated_at = new Date();

    const result = await db('products').where({ id }).update(updateData);
    
    if (result === 0) {
      return null;
    }

    // Si se proporcionan categorías, actualizarlas
    if (updates.categories !== undefined && updates.categories.length > 0) {
      console.log('✅ Actualizando categorías:', updates.categories);
      await this.updateCategories(id, updates.categories);
    } else if (updates.category !== undefined) {
      console.log('✅ Actualizando solo categoría primaria:', updates.category);
      // Si solo se actualiza la categoría primaria, actualizar en la tabla de unión
      await this.setPrimaryCategory(id, updates.category);
    } else {
      console.log('⚠️ No se recibieron categorías para actualizar');
    }

    return this.findById(id);
  }

  static async findAll(filters: ProductFilters = {}): Promise<{ products: Product[]; total: number }> {
    const { 
      category, 
      minPrice, 
      maxPrice, 
      inStock, 
      lowStock, 
      search, 
      page = 1, 
      limit = 10 
    } = filters;
    
    let query = db('products').select('*');

    // Aplicar filtros
    if (category) {
      // Buscar productos que tengan esta categoría (primaria o secundaria)
      const productIds = await db('product_categories')
        .where({ category_name: category })
        .select('product_id');
      
      if (productIds.length > 0) {
        const ids = productIds.map(p => p.product_id);
        query = query.whereIn('id', ids);
      } else {
        // Si no hay productos con esta categoría, retornar vacío
        query = query.where('id', null);
      }
    }

    if (minPrice !== undefined) {
      query = query.where('price', '>=', minPrice);
    }

    if (maxPrice !== undefined) {
      query = query.where('price', '<=', maxPrice);
    }

    if (inStock !== undefined) {
      if (inStock) {
        query = query.where('stock', '>', 0);
      } else {
        query = query.where('stock', '=', 0);
      }
    }

    if (lowStock) {
      query = query.whereRaw('stock <= min_stock AND stock > 0');
    }

    if (search) {
      query = query.where(function() {
        this.where('name', 'like', `%${search}%`)
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

    const products = await query;
    
    // Formatear productos con sus categorías
    const formattedProducts = await Promise.all(
      products.map(product => this.formatProduct(product))
    );
    
    return {
      products: formattedProducts,
      total
    };
  }

  static async delete(id: string): Promise<boolean> {
    const result = await db('products').where({ id }).del();
    return result > 0;
  }

  static async updateStock(id: string, quantity: number, type: 'in' | 'out' | 'adjustment', reason: string, referenceId?: string): Promise<Product | null> {
    const product = await this.findById(id);
    if (!product) return null;

    let newStock: number;
    
    switch (type) {
      case 'in':
        newStock = product.stock + quantity;
        break;
      case 'out':
        newStock = Math.max(0, product.stock - quantity);
        break;
      case 'adjustment':
        newStock = quantity;
        break;
      default:
        throw new Error('Invalid stock movement type');
    }

    await db('products')
      .where({ id })
      .update({ 
        stock: newStock,
        updated_at: new Date()
      });

    // Registrar el movimiento de stock
    await this.recordStockMovement(id, type, quantity, reason, referenceId);

    return this.findById(id);
  }

  static async recordStockMovement(productId: string, type: 'in' | 'out' | 'adjustment', quantity: number, reason: string, referenceId?: string): Promise<void> {
    await db('stock_movements').insert({
      product_id: productId,
      type,
      quantity,
      reason,
      reference_id: referenceId || null
    });
  }

  static async getStockMovements(productId: string, limit: number = 50): Promise<StockMovement[]> {
    const movements = await db('stock_movements')
      .where({ product_id: productId })
      .orderBy('created_at', 'desc')
      .limit(limit);

    return movements.map(movement => ({
      id: movement.id,
      productId: movement.product_id,
      type: movement.type,
      quantity: movement.quantity,
      reason: movement.reason,
      referenceId: movement.reference_id,
      createdAt: movement.created_at
    }));
  }

  static async getLowStockAlerts(): Promise<LowStockAlert[]> {
    const products = await db('products')
      .whereRaw('stock <= min_stock')
      .where('stock', '>=', 0);

    const alerts = await Promise.all(
      products.map(async product => ({
        product: await this.formatProduct(product),
        currentStock: product.stock,
        minStock: product.min_stock,
        difference: product.min_stock - product.stock
      }))
    );

    return alerts;
  }

  static async getProductStats(): Promise<ProductStats> {
    const [totalResult] = await db('products').count('* as count');
    const totalProducts = parseInt(totalResult.count as string);

    const [inStockResult] = await db('products')
      .where('stock', '>', 0)
      .count('* as count');
    const inStockProducts = parseInt(inStockResult.count as string);

    const [lowStockResult] = await db('products')
      .whereRaw('stock <= min_stock AND stock > 0')
      .count('* as count');
    const lowStockProducts = parseInt(lowStockResult.count as string);

    const [outOfStockResult] = await db('products')
      .where('stock', '=', 0)
      .count('* as count');
    const outOfStockProducts = parseInt(outOfStockResult.count as string);

    const [totalValueResult] = await db('products')
      .select(db.raw('SUM(price * stock) as total_value'));
    const totalValue = parseFloat(totalValueResult.total_value as string) || 0;

    const [categoriesResult] = await db('products')
      .countDistinct('category as count');
    const categoriesCount = parseInt(categoriesResult.count as string);

    const [avgPriceResult] = await db('products')
      .avg('price as avg');
    const averagePrice = parseFloat(avgPriceResult.avg as string) || 0;

    return {
      totalProducts,
      inStockProducts,
      lowStockProducts,
      outOfStockProducts,
      totalValue,
      categoriesCount,
      averagePrice
    };
  }

  static async getProductsByCategory(category: string): Promise<Product[]> {
    // Buscar productos que tengan esta categoría (primaria o secundaria)
    const productIds = await db('product_categories')
      .where({ category_name: category })
      .select('product_id');

    if (productIds.length === 0) {
      return [];
    }

    const ids = productIds.map(p => p.product_id);
    const products = await db('products')
      .whereIn('id', ids)
      .where('stock', '>', 0)
      .orderBy('name');

    return await Promise.all(products.map(product => this.formatProduct(product)));
  }

  static async getProductCategories(): Promise<Array<{ name: string; description: string; productCount: number }>> {
    // Contar productos por categoría desde la tabla de unión
    // Un producto puede aparecer en múltiples categorías
    const categories = await db('product_categories')
      .join('products', 'product_categories.product_id', 'products.id')
      .select('product_categories.category_name')
      .count('DISTINCT product_categories.product_id as productCount')
      .groupBy('product_categories.category_name')
      .orderBy('productCount', 'desc');

    return categories.map(cat => ({
      name: String(cat.category_name),
      description: `Productos de ${String(cat.category_name).toLowerCase()}`,
      productCount: parseInt(cat.productCount as string)
    }));
  }

  static async getCompatibleProducts(serviceId: string): Promise<Product[]> {
    const products = await db('products')
      .whereRaw('JSON_CONTAINS(compatible_services, ?)', [`"${serviceId}"`])
      .where('stock', '>', 0);

    return await Promise.all(products.map(product => this.formatProduct(product)));
  }

  static async checkAvailability(productId: string, requiredQuantity: number): Promise<boolean> {
    const product = await this.findById(productId);
    return product ? product.stock >= requiredQuantity : false;
  }

  static async reserveStock(productId: string, quantity: number, referenceId: string): Promise<boolean> {
    const product = await this.findById(productId);
    if (!product || product.stock < quantity) {
      return false;
    }

    await this.updateStock(productId, quantity, 'out', `Reservado para ${referenceId}`, referenceId);
    return true;
  }

  static async releaseStock(productId: string, quantity: number, referenceId: string): Promise<boolean> {
    await this.updateStock(productId, quantity, 'in', `Liberado de ${referenceId}`, referenceId);
    return true;
  }

  // ============================================
  // MÉTODOS DE GESTIÓN DE CATEGORÍAS MÚLTIPLES
  // ============================================

  /**
   * Agregar una categoría a un producto
   * @param productId ID del producto
   * @param categoryName Nombre de la categoría
   * @param isPrimary Si es la categoría primaria
   */
  static async addCategory(productId: string, categoryName: string, isPrimary: boolean = false): Promise<void> {
    // Verificar que el producto existe
    const product = await this.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Verificar si la categoría ya está asignada
    const existing = await db('product_categories')
      .where({ product_id: productId, category_name: categoryName })
      .first();

    if (existing) {
      throw new Error(`Category '${categoryName}' is already assigned to this product`);
    }

    // Si es primaria, desmarcar otras categorías primarias
    if (isPrimary) {
      await db('product_categories')
        .where({ product_id: productId, is_primary: true })
        .update({ is_primary: false });
    }

    // Obtener el siguiente display_order
    const [maxOrder] = await db('product_categories')
      .where({ product_id: productId })
      .max('display_order as max');
    const displayOrder = (maxOrder.max || -1) + 1;

    // Insertar la nueva categoría
    await db('product_categories').insert({
      id: db.raw('UUID()'),
      product_id: productId,
      category_name: categoryName,
      is_primary: isPrimary,
      display_order: displayOrder
    });
  }

  /**
   * Remover una categoría de un producto
   * @param productId ID del producto
   * @param categoryName Nombre de la categoría a remover
   */
  static async removeCategory(productId: string, categoryName: string): Promise<void> {
    // Verificar que el producto existe
    const product = await this.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Verificar que la categoría está asignada
    const category = await db('product_categories')
      .where({ product_id: productId, category_name: categoryName })
      .first();

    if (!category) {
      throw new Error(`Category '${categoryName}' is not assigned to this product`);
    }

    // Verificar que no es la última categoría
    const [count] = await db('product_categories')
      .where({ product_id: productId })
      .count('* as count');

    if (parseInt(count.count as string) <= 1) {
      throw new Error('Cannot remove the last category. Product must have at least one category.');
    }

    const wasPrimary = category.is_primary;

    // Eliminar la categoría
    await db('product_categories')
      .where({ product_id: productId, category_name: categoryName })
      .del();

    // Si era primaria, asignar otra categoría como primaria
    if (wasPrimary) {
      const [firstCategory] = await db('product_categories')
        .where({ product_id: productId })
        .orderBy('display_order', 'asc')
        .limit(1);

      if (firstCategory) {
        await db('product_categories')
          .where({ id: firstCategory.id })
          .update({ is_primary: true });
      }
    }
  }

  /**
   * Obtener todas las categorías de un producto
   * @param productId ID del producto
   * @returns Array de nombres de categorías ordenadas por display_order
   */
  static async getCategoriesForProduct(productId: string): Promise<string[]> {
    const categories = await db('product_categories')
      .where({ product_id: productId })
      .orderBy('display_order', 'asc')
      .select('category_name');

    return categories.map(cat => cat.category_name);
  }

  /**
   * Actualizar todas las categorías de un producto
   * @param productId ID del producto
   * @param categories Array de nombres de categorías (la primera será la primaria)
   */
  static async updateCategories(productId: string, categories: string[]): Promise<void> {
    // Validar que hay al menos una categoría
    if (!categories || categories.length === 0) {
      throw new Error('At least one category must be provided');
    }

    // Verificar que el producto existe
    const product = await this.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Eliminar categorías duplicadas
    const uniqueCategories = Array.from(new Set(categories));

    // Eliminar todas las categorías existentes
    await db('product_categories')
      .where({ product_id: productId })
      .del();

    // Insertar las nuevas categorías
    const insertData = uniqueCategories.map((categoryName, index) => ({
      id: db.raw('UUID()'),
      product_id: productId,
      category_name: categoryName,
      is_primary: index === 0, // La primera es la primaria
      display_order: index
    }));

    await db('product_categories').insert(insertData);

    // Actualizar la columna category en products con la categoría primaria
    await db('products')
      .where({ id: productId })
      .update({ category: uniqueCategories[0] });
  }

  /**
   * Establecer una categoría como primaria
   * @param productId ID del producto
   * @param categoryName Nombre de la categoría a establecer como primaria
   */
  static async setPrimaryCategory(productId: string, categoryName: string): Promise<void> {
    // Verificar que el producto existe
    const product = await this.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Verificar que la categoría está asignada
    const category = await db('product_categories')
      .where({ product_id: productId, category_name: categoryName })
      .first();

    if (!category) {
      throw new Error(`Category '${categoryName}' is not assigned to this product`);
    }

    // Desmarcar todas las categorías primarias
    await db('product_categories')
      .where({ product_id: productId })
      .update({ is_primary: false });

    // Marcar la nueva categoría como primaria
    await db('product_categories')
      .where({ product_id: productId, category_name: categoryName })
      .update({ is_primary: true });
  }

  private static async formatProduct(dbProduct: any): Promise<Product> {
    // Obtener todas las categorías del producto desde la tabla de unión
    const categories = await db('product_categories')
      .where({ product_id: dbProduct.id })
      .orderBy('display_order', 'asc')
      .select('category_name');

    const categoryNames = categories.map(c => c.category_name);

    return {
      id: dbProduct.id,
      name: dbProduct.name,
      category: dbProduct.category, // Categoría primaria para backward compatibility
      categories: categoryNames.length > 0 ? categoryNames : [dbProduct.category], // Usar categorías de la tabla de unión o fallback
      price: parseFloat(dbProduct.price),
      paymentLink: dbProduct.payment_link || undefined,
      stock: dbProduct.stock,
      minStock: dbProduct.min_stock,
      description: dbProduct.description || '',
      benefits: dbProduct.benefits || '',
      images: Array.isArray(dbProduct.images) ? dbProduct.images : (dbProduct.images ? JSON.parse(dbProduct.images) : []),
      ingredients: Array.isArray(dbProduct.ingredients) ? dbProduct.ingredients : (dbProduct.ingredients ? JSON.parse(dbProduct.ingredients) : []),
      compatibleServices: Array.isArray(dbProduct.compatible_services) ? dbProduct.compatible_services : (dbProduct.compatible_services ? JSON.parse(dbProduct.compatible_services) : []),
      createdAt: dbProduct.created_at,
      updatedAt: dbProduct.updated_at
    };
  }
}
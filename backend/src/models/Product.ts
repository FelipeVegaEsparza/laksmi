import db from '../config/database';
import { Product, CreateProductRequest, UpdateProductRequest, ProductFilters, StockMovement, ProductStats, LowStockAlert } from '../types/product';

export class ProductModel {
  static async findById(id: string): Promise<Product | null> {
    const product = await db('products').where({ id }).first();
    if (!product) return null;
    
    return this.formatProduct(product);
  }

  static async findByName(name: string): Promise<Product | null> {
    const product = await db('products').where({ name }).first();
    if (!product) return null;
    
    return this.formatProduct(product);
  }

  static async create(productData: CreateProductRequest): Promise<Product> {
    const insertData = {
      name: productData.name,
      category: productData.category,
      price: productData.price,
      stock: productData.stock,
      min_stock: productData.minStock || 5,
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

    return this.formatProduct(product);
  }

  static async update(id: string, updates: UpdateProductRequest): Promise<Product | null> {
    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.price !== undefined) updateData.price = updates.price;
    if (updates.stock !== undefined) updateData.stock = updates.stock;
    if (updates.minStock !== undefined) updateData.min_stock = updates.minStock;
    if (updates.ingredients !== undefined) updateData.ingredients = JSON.stringify(updates.ingredients);
    if (updates.compatibleServices !== undefined) updateData.compatible_services = JSON.stringify(updates.compatibleServices);
    
    updateData.updated_at = new Date();

    const result = await db('products').where({ id }).update(updateData);
    
    if (result === 0) {
      return null;
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
      query = query.where('category', category);
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
    
    return {
      products: products.map(product => this.formatProduct(product)),
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

    return products.map(product => ({
      product: this.formatProduct(product),
      currentStock: product.stock,
      minStock: product.min_stock,
      difference: product.min_stock - product.stock
    }));
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
    const products = await db('products')
      .where({ category })
      .where('stock', '>', 0)
      .orderBy('name');

    return products.map(product => this.formatProduct(product));
  }

  static async getCompatibleProducts(serviceId: string): Promise<Product[]> {
    const products = await db('products')
      .whereRaw('JSON_CONTAINS(compatible_services, ?)', [`"${serviceId}"`])
      .where('stock', '>', 0);

    return products.map(product => this.formatProduct(product));
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

  private static formatProduct(dbProduct: any): Product {
    return {
      id: dbProduct.id,
      name: dbProduct.name,
      category: dbProduct.category,
      price: parseFloat(dbProduct.price),
      stock: dbProduct.stock,
      minStock: dbProduct.min_stock,
      description: dbProduct.description || '',
      images: Array.isArray(dbProduct.images) ? dbProduct.images : (dbProduct.images ? JSON.parse(dbProduct.images) : []),
      ingredients: Array.isArray(dbProduct.ingredients) ? dbProduct.ingredients : (dbProduct.ingredients ? JSON.parse(dbProduct.ingredients) : []),
      compatibleServices: Array.isArray(dbProduct.compatible_services) ? dbProduct.compatible_services : (dbProduct.compatible_services ? JSON.parse(dbProduct.compatible_services) : []),
      createdAt: dbProduct.created_at,
      updatedAt: dbProduct.updated_at
    };
  }
}
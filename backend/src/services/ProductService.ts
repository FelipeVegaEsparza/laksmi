import { ProductModel } from '../models/Product';
import { Product, CreateProductRequest, UpdateProductRequest, ProductFilters, LowStockAlert, ProductStats } from '../types/product';

export class ProductService {
  static async createProduct(productData: CreateProductRequest): Promise<Product> {
    // Validar que el nombre no esté duplicado
    const existingProduct = await ProductModel.findByName(productData.name);
    if (existingProduct) {
      throw new Error('Ya existe un producto con ese nombre');
    }

    // Validar datos básicos
    if (productData.price <= 0) {
      throw new Error('El precio debe ser mayor a 0');
    }

    if (productData.stock < 0) {
      throw new Error('El stock no puede ser negativo');
    }

    if (productData.minStock && productData.minStock < 0) {
      throw new Error('El stock mínimo no puede ser negativo');
    }

    return await ProductModel.create(productData);
  }

  static async updateProduct(id: string, updates: UpdateProductRequest): Promise<Product> {
    const existingProduct = await ProductModel.findById(id);
    if (!existingProduct) {
      throw new Error('Producto no encontrado');
    }

    // Validar nombre único si se está actualizando
    if (updates.name && updates.name !== existingProduct.name) {
      const duplicateProduct = await ProductModel.findByName(updates.name);
      if (duplicateProduct) {
        throw new Error('Ya existe un producto con ese nombre');
      }
    }

    // Validar datos
    if (updates.price !== undefined && updates.price <= 0) {
      throw new Error('El precio debe ser mayor a 0');
    }

    if (updates.stock !== undefined && updates.stock < 0) {
      throw new Error('El stock no puede ser negativo');
    }

    if (updates.minStock !== undefined && updates.minStock < 0) {
      throw new Error('El stock mínimo no puede ser negativo');
    }

    const updatedProduct = await ProductModel.update(id, updates);
    if (!updatedProduct) {
      throw new Error('Error al actualizar el producto');
    }

    return updatedProduct;
  }

  static async getProduct(id: string): Promise<Product> {
    const product = await ProductModel.findById(id);
    if (!product) {
      throw new Error('Producto no encontrado');
    }
    return product;
  }

  static async getProducts(filters: ProductFilters = {}): Promise<{ products: Product[]; total: number; page: number; totalPages: number }> {
    const { page = 1, limit = 10 } = filters;
    const result = await ProductModel.findAll(filters);
    
    return {
      ...result,
      page,
      totalPages: Math.ceil(result.total / limit)
    };
  }

  static async deleteProduct(id: string): Promise<void> {
    const product = await ProductModel.findById(id);
    if (!product) {
      throw new Error('Producto no encontrado');
    }

    const deleted = await ProductModel.delete(id);
    if (!deleted) {
      throw new Error('Error al eliminar el producto');
    }
  }

  static async updateStock(id: string, quantity: number, type: 'in' | 'out' | 'adjustment', reason: string, referenceId?: string): Promise<Product> {
    if (quantity <= 0) {
      throw new Error('La cantidad debe ser mayor a 0');
    }

    const updatedProduct = await ProductModel.updateStock(id, quantity, type, reason, referenceId);
    if (!updatedProduct) {
      throw new Error('Producto no encontrado');
    }

    return updatedProduct;
  }

  static async getLowStockAlerts(): Promise<LowStockAlert[]> {
    return await ProductModel.getLowStockAlerts();
  }

  static async getProductStats(): Promise<ProductStats> {
    return await ProductModel.getProductStats();
  }

  static async getProductsByCategory(category: string): Promise<Product[]> {
    return await ProductModel.getProductsByCategory(category);
  }

  static async getCompatibleProducts(serviceId: string): Promise<Product[]> {
    return await ProductModel.getCompatibleProducts(serviceId);
  }

  static async checkProductAvailability(productId: string, requiredQuantity: number): Promise<{ available: boolean; currentStock: number }> {
    const product = await ProductModel.findById(productId);
    if (!product) {
      throw new Error('Producto no encontrado');
    }

    return {
      available: product.stock >= requiredQuantity,
      currentStock: product.stock
    };
  }

  static async reserveProductStock(productId: string, quantity: number, referenceId: string): Promise<boolean> {
    if (quantity <= 0) {
      throw new Error('La cantidad debe ser mayor a 0');
    }

    const availability = await this.checkProductAvailability(productId, quantity);
    if (!availability.available) {
      throw new Error(`Stock insuficiente. Disponible: ${availability.currentStock}, Requerido: ${quantity}`);
    }

    return await ProductModel.reserveStock(productId, quantity, referenceId);
  }

  static async releaseProductStock(productId: string, quantity: number, referenceId: string): Promise<boolean> {
    if (quantity <= 0) {
      throw new Error('La cantidad debe ser mayor a 0');
    }

    return await ProductModel.releaseStock(productId, quantity, referenceId);
  }

  static async getStockMovements(productId: string, limit: number = 50) {
    const product = await ProductModel.findById(productId);
    if (!product) {
      throw new Error('Producto no encontrado');
    }

    return await ProductModel.getStockMovements(productId, limit);
  }

  static async bulkUpdateStock(updates: Array<{ productId: string; quantity: number; type: 'in' | 'out' | 'adjustment'; reason: string }>): Promise<Product[]> {
    const results: Product[] = [];

    for (const update of updates) {
      const updatedProduct = await this.updateStock(
        update.productId,
        update.quantity,
        update.type,
        update.reason
      );
      results.push(updatedProduct);
    }

    return results;
  }

  static async getProductCategories(): Promise<Array<{ category: string; count: number }>> {
    const products = await ProductModel.findAll();
    const categoryMap = new Map<string, number>();

    products.products.forEach(product => {
      const count = categoryMap.get(product.category) || 0;
      categoryMap.set(product.category, count + 1);
    });

    return Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count
    })).sort((a, b) => b.count - a.count);
  }

  // Métodos públicos para el frontend
  static async getPublicProducts(filters: ProductFilters = {}): Promise<{ products: Product[]; total: number; page: number; totalPages: number }> {
    // Forzar filtros para productos públicos
    const publicFilters = {
      ...filters,
      inStock: true, // Solo productos en stock
    };

    const { page = 1, limit = 20 } = publicFilters;
    const result = await ProductModel.findAll(publicFilters);
    
    // Los productos ya tienen la información pública necesaria
    const publicProducts = result.products;
    
    return {
      products: publicProducts,
      total: result.total,
      page,
      totalPages: Math.ceil(result.total / limit)
    };
  }

  static async getPublicProduct(id: string): Promise<Product> {
    const product = await ProductModel.findById(id);
    if (!product) {
      throw new Error('Producto no encontrado');
    }

    // Solo mostrar productos en stock al público
    if (product.stock <= 0) {
      throw new Error('Producto no disponible');
    }

    // El producto ya tiene la información pública necesaria
    return product;
  }

  static async getPublicProductsByCategory(category: string): Promise<Product[]> {
    const products = await ProductModel.getProductsByCategory(category);
    
    // Solo productos en stock
    return products.filter(product => product.stock > 0);
  }
}
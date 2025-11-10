import { Request, Response } from 'express';
import { ProductService } from '../services/ProductService';
import { CreateProductRequest, UpdateProductRequest, ProductFilters } from '../types/product';

export class ProductController {
  static async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const productData: CreateProductRequest = req.body;
      const product = await ProductService.createProduct(productData);
      
      res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        data: product
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al crear producto'
      });
    }
  }

  static async getProducts(req: Request, res: Response): Promise<void> {
    try {
      const filters: ProductFilters = {
        category: req.query.category as string,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        inStock: req.query.inStock ? req.query.inStock === 'true' : undefined,
        lowStock: req.query.lowStock === 'true',
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10
      };

      const result = await ProductService.getProducts(filters);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener productos'
      });
    }
  }

  static async getProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const product = await ProductService.getProduct(id);
      
      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'Producto no encontrado' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener producto'
      });
    }
  }

  static async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates: UpdateProductRequest = req.body;
      const product = await ProductService.updateProduct(id, updates);
      
      res.json({
        success: true,
        message: 'Producto actualizado exitosamente',
        data: product
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'Producto no encontrado' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al actualizar producto'
      });
    }
  }

  static async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await ProductService.deleteProduct(id);
      
      res.json({
        success: true,
        message: 'Producto eliminado exitosamente'
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'Producto no encontrado' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al eliminar producto'
      });
    }
  }

  static async updateStock(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { quantity, type, reason, referenceId } = req.body;

      if (!quantity || !type || !reason) {
        res.status(400).json({
          success: false,
          message: 'Cantidad, tipo y razón son requeridos'
        });
        return;
      }

      const product = await ProductService.updateStock(id, quantity, type, reason, referenceId);
      
      res.json({
        success: true,
        message: 'Stock actualizado exitosamente',
        data: product
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'Producto no encontrado' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al actualizar stock'
      });
    }
  }

  static async getStockMovements(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      const movements = await ProductService.getStockMovements(id, limit);
      
      res.json({
        success: true,
        data: movements
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'Producto no encontrado' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener movimientos de stock'
      });
    }
  }

  static async getLowStockAlerts(req: Request, res: Response): Promise<void> {
    try {
      const alerts = await ProductService.getLowStockAlerts();
      
      res.json({
        success: true,
        data: alerts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener alertas de stock bajo'
      });
    }
  }

  static async getProductStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await ProductService.getProductStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener estadísticas de productos'
      });
    }
  }

  static async getProductsByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.params;
      const products = await ProductService.getProductsByCategory(category);
      
      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener productos por categoría'
      });
    }
  }

  static async getCompatibleProducts(req: Request, res: Response): Promise<void> {
    try {
      const { serviceId } = req.params;
      const products = await ProductService.getCompatibleProducts(serviceId);
      
      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener productos compatibles'
      });
    }
  }

  static async checkAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { quantity } = req.query;

      if (!quantity) {
        res.status(400).json({
          success: false,
          message: 'La cantidad es requerida'
        });
        return;
      }

      const result = await ProductService.checkProductAvailability(id, parseInt(quantity as string));
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'Producto no encontrado' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al verificar disponibilidad'
      });
    }
  }

  static async reserveStock(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { quantity, referenceId } = req.body;

      if (!quantity || !referenceId) {
        res.status(400).json({
          success: false,
          message: 'Cantidad y referencia son requeridas'
        });
        return;
      }

      const success = await ProductService.reserveProductStock(id, quantity, referenceId);
      
      res.json({
        success: true,
        message: success ? 'Stock reservado exitosamente' : 'Error al reservar stock',
        data: { reserved: success }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al reservar stock'
      });
    }
  }

  static async releaseStock(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { quantity, referenceId } = req.body;

      if (!quantity || !referenceId) {
        res.status(400).json({
          success: false,
          message: 'Cantidad y referencia son requeridas'
        });
        return;
      }

      const success = await ProductService.releaseProductStock(id, quantity, referenceId);
      
      res.json({
        success: true,
        message: success ? 'Stock liberado exitosamente' : 'Error al liberar stock',
        data: { released: success }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al liberar stock'
      });
    }
  }

  static async bulkUpdateStock(req: Request, res: Response): Promise<void> {
    try {
      const { updates } = req.body;

      if (!Array.isArray(updates) || updates.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Se requiere un array de actualizaciones'
        });
        return;
      }

      const results = await ProductService.bulkUpdateStock(updates);
      
      res.json({
        success: true,
        message: 'Stock actualizado en lote exitosamente',
        data: results
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al actualizar stock en lote'
      });
    }
  }

  static async getProductCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await ProductService.getProductCategories();
      
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener categorías de productos'
      });
    }
  }

  // Métodos públicos para el frontend
  static async getPublicProducts(req: Request, res: Response): Promise<void> {
    try {
      const filters: ProductFilters = {
        category: req.query.category as string,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        inStock: true, // Solo productos en stock para el público
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20
      };

      const result = await ProductService.getPublicProducts(filters);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener productos'
      });
    }
  }

  static async getPublicProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const product = await ProductService.getPublicProduct(id);
      
      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'Producto no encontrado' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener producto'
      });
    }
  }

  static async getPublicProductsByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.params;
      const products = await ProductService.getPublicProductsByCategory(category);
      
      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener productos por categoría'
      });
    }
  }
}
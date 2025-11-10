import { Request, Response } from 'express';
import { CategoryService } from '../services/CategoryService';
import { CreateCategoryRequest, UpdateCategoryRequest, CategoryFilters } from '../types/category';
import logger from '../utils/logger';

export class CategoryController {
  static async createCategory(req: Request, res: Response): Promise<void> {
    try {
      const categoryData: CreateCategoryRequest = req.body;
      const category = await CategoryService.createCategory(categoryData);
      
      res.status(201).json({
        success: true,
        message: 'Categoría creada exitosamente',
        data: category
      });
    } catch (error: any) {
      logger.error('Create category error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al crear categoría'
      });
    }
  }

  static async updateCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates: UpdateCategoryRequest = req.body;
      
      const category = await CategoryService.updateCategory(id, updates);
      
      res.json({
        success: true,
        message: 'Categoría actualizada exitosamente',
        data: category
      });
    } catch (error: any) {
      logger.error('Update category error:', error);
      const statusCode = error.message === 'Categoría no encontrada' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Error al actualizar categoría'
      });
    }
  }

  static async deleteCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await CategoryService.deleteCategory(id);
      
      res.json({
        success: true,
        message: 'Categoría eliminada exitosamente'
      });
    } catch (error: any) {
      logger.error('Delete category error:', error);
      const statusCode = error.message === 'Categoría no encontrada' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Error al eliminar categoría'
      });
    }
  }

  static async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const filters: CategoryFilters = {
        type: req.query.type as 'service' | 'product' | undefined,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        search: req.query.search as string | undefined
      };

      const categories = await CategoryService.getCategories(filters);
      
      res.json({
        success: true,
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

  static async getCategoryById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const category = await CategoryService.getCategoryById(id);
      
      res.json({
        success: true,
        data: category
      });
    } catch (error: any) {
      logger.error('Get category by ID error:', error);
      const statusCode = error.message === 'Categoría no encontrada' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Error al obtener categoría'
      });
    }
  }

  static async getCategoryUsage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usage = await CategoryService.getCategoryUsage(id);
      
      res.json({
        success: true,
        data: usage
      });
    } catch (error: any) {
      logger.error('Get category usage error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener uso de categoría'
      });
    }
  }
}

import { CategoryModel } from '../models/Category';
import { Category, CreateCategoryRequest, UpdateCategoryRequest, CategoryFilters } from '../types/category';
import logger from '../utils/logger';

export class CategoryService {
  static async createCategory(categoryData: CreateCategoryRequest): Promise<Category> {
    try {
      // Verificar si ya existe
      const existing = await CategoryModel.findByName(categoryData.name, categoryData.type);
      if (existing) {
        throw new Error(`Ya existe una categoría de ${categoryData.type === 'service' ? 'servicios' : 'productos'} con ese nombre`);
      }

      const category = await CategoryModel.create(categoryData);
      logger.info(`Category created: ${category.name} (${category.type})`);
      
      return category;
    } catch (error: any) {
      logger.error('Create category error:', error);
      throw error;
    }
  }

  static async updateCategory(id: string, updates: UpdateCategoryRequest): Promise<Category> {
    try {
      const category = await CategoryModel.findById(id);
      if (!category) {
        throw new Error('Categoría no encontrada');
      }

      // Si se está cambiando el nombre, verificar que no exista
      if (updates.name && updates.name !== category.name) {
        const existing = await CategoryModel.findByName(updates.name, category.type);
        if (existing) {
          throw new Error('Ya existe una categoría con ese nombre');
        }
      }

      const updated = await CategoryModel.update(id, updates);
      if (!updated) {
        throw new Error('Error al actualizar categoría');
      }

      logger.info(`Category updated: ${updated.name}`);
      return updated;
    } catch (error: any) {
      logger.error('Update category error:', error);
      throw error;
    }
  }

  static async deleteCategory(id: string): Promise<void> {
    try {
      const category = await CategoryModel.findById(id);
      if (!category) {
        throw new Error('Categoría no encontrada');
      }

      // Verificar si está en uso
      const usage = await CategoryModel.checkUsage(id);
      if (usage.services > 0 || usage.products > 0) {
        throw new Error(`No se puede eliminar. La categoría está siendo usada por ${usage.services} servicios y ${usage.products} productos`);
      }

      await CategoryModel.delete(id);
      logger.info(`Category deleted: ${category.name}`);
    } catch (error: any) {
      logger.error('Delete category error:', error);
      throw error;
    }
  }

  static async getCategories(filters: CategoryFilters = {}): Promise<Category[]> {
    try {
      return await CategoryModel.findAll(filters);
    } catch (error: any) {
      logger.error('Get categories error:', error);
      throw error;
    }
  }

  static async getCategoryById(id: string): Promise<Category> {
    try {
      const category = await CategoryModel.findById(id);
      if (!category) {
        throw new Error('Categoría no encontrada');
      }
      return category;
    } catch (error: any) {
      logger.error('Get category by ID error:', error);
      throw error;
    }
  }

  static async getCategoryUsage(id: string): Promise<{ services: number; products: number }> {
    try {
      return await CategoryModel.checkUsage(id);
    } catch (error: any) {
      logger.error('Get category usage error:', error);
      throw error;
    }
  }
}

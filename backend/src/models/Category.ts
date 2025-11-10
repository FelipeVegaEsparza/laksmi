import db from '../config/database';
import { Category, CreateCategoryRequest, UpdateCategoryRequest, CategoryFilters } from '../types/category';

export class CategoryModel {
  static async findById(id: string): Promise<Category | null> {
    const category = await db('categories').where({ id }).first();
    if (!category) return null;
    
    return this.formatCategory(category);
  }

  static async findByName(name: string, type: 'service' | 'product'): Promise<Category | null> {
    const category = await db('categories')
      .where({ name, type })
      .first();
    
    if (!category) return null;
    return this.formatCategory(category);
  }

  static async create(categoryData: CreateCategoryRequest): Promise<Category> {
    await db('categories').insert({
      name: categoryData.name,
      type: categoryData.type,
      description: categoryData.description || null,
      is_active: true
    });

    // Buscar la categoría recién creada
    const category = await db('categories')
      .where({ name: categoryData.name, type: categoryData.type })
      .first();
    
    if (!category) {
      throw new Error('Error creating category');
    }

    return this.formatCategory(category);
  }

  static async update(id: string, updates: UpdateCategoryRequest): Promise<Category | null> {
    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    
    updateData.updated_at = db.fn.now();

    await db('categories').where({ id }).update(updateData);

    return this.findById(id);
  }

  static async delete(id: string): Promise<boolean> {
    const deleted = await db('categories').where({ id }).delete();
    return deleted > 0;
  }

  static async findAll(filters: CategoryFilters = {}): Promise<Category[]> {
    let query = db('categories');

    if (filters.type) {
      query = query.where('type', filters.type);
    }

    if (filters.isActive !== undefined) {
      query = query.where('is_active', filters.isActive);
    }

    if (filters.search) {
      query = query.where('name', 'like', `%${filters.search}%`);
    }

    const categories = await query.orderBy('name', 'asc');
    return categories.map(cat => this.formatCategory(cat));
  }

  static async checkUsage(id: string): Promise<{ services: number; products: number }> {
    const [servicesCount] = await db('services')
      .where('category', db('categories').select('name').where('id', id).first())
      .count('* as count');

    const [productsCount] = await db('products')
      .where('category', db('categories').select('name').where('id', id).first())
      .count('* as count');

    return {
      services: Number(servicesCount?.count) || 0,
      products: Number(productsCount?.count) || 0
    };
  }

  private static formatCategory(dbCategory: any): Category {
    return {
      id: dbCategory.id,
      name: dbCategory.name,
      type: dbCategory.type,
      description: dbCategory.description,
      isActive: Boolean(dbCategory.is_active),
      createdAt: dbCategory.created_at,
      updatedAt: dbCategory.updated_at
    };
  }
}

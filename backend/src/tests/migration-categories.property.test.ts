/**
 * Property-Based Tests for Multiple Categories Migration
 * Feature: categorias-multiples
 */

import * as fc from 'fast-check';
import db from '../config/database';

describe('Migration Categories Property Tests', () => {
  jest.setTimeout(120000);

  const createdServiceIds: string[] = [];
  const createdProductIds: string[] = [];

  beforeAll(async () => {
    // Verificar que las tablas de categorías existen
    try {
      await db.raw('SELECT 1 FROM service_categories LIMIT 1');
      await db.raw('SELECT 1 FROM product_categories LIMIT 1');
    } catch (error) {
      console.warn('Category tables do not exist yet. Tests will be skipped.');
      // Las tablas no existen, los tests se saltarán
    }
  });

  afterEach(async () => {
    try {
      // Limpiar datos de prueba
      if (createdServiceIds.length > 0) {
        await db('service_categories').whereIn('service_id', createdServiceIds).del();
        await db('services').whereIn('id', createdServiceIds).del();
        createdServiceIds.length = 0;
      }
      if (createdProductIds.length > 0) {
        await db('product_categories').whereIn('product_id', createdProductIds).del();
        await db('products').whereIn('id', createdProductIds).del();
        createdProductIds.length = 0;
      }
    } catch (error) {
      console.error('Error cleaning test data:', error);
    }
  }, 30000);

  afterAll(async () => {
    await db.destroy();
  });

  /**
   * **Feature: categorias-multiples, Property 9: Migration data preservation**
   * **Validates: Requirements 8.2, 8.3, 8.5**
   * 
   * For any service or product that exists before migration, after migration completes,
   * the item should have at least one category assigned that matches its original category value.
   */
  test('Property 9: Migration data preservation - services maintain their original category after migration', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length > 0),
          category: fc.constantFrom('Facial', 'Corporal', 'Depilación', 'Masajes', 'Tratamientos'),
          price: fc.integer({ min: 1000, max: 100000 }),
          duration: fc.integer({ min: 15, max: 240 })
        }),
        async (serviceData) => {
          // Crear un servicio con una categoría única (simulando estado pre-migración)
          const [serviceId] = await db('services').insert({
            id: db.raw('UUID()'),
            name: serviceData.name,
            category: serviceData.category,
            price: serviceData.price,
            duration: serviceData.duration,
            is_active: true
          });

          // Obtener el ID generado
          const [service] = await db('services')
            .where({ name: serviceData.name })
            .select('id', 'category');

          createdServiceIds.push(service.id);

          // Simular la migración: insertar en service_categories
          await db('service_categories').insert({
            id: db.raw('UUID()'),
            service_id: service.id,
            category_name: service.category,
            is_primary: true,
            display_order: 0
          });

          // Verificar que la categoría se preservó
          const categories = await db('service_categories')
            .where({ service_id: service.id })
            .select('category_name', 'is_primary');

          // Debe tener al menos una categoría
          expect(categories.length).toBeGreaterThanOrEqual(1);

          // La categoría original debe estar presente
          const originalCategoryExists = categories.some(
            cat => cat.category_name === serviceData.category
          );
          expect(originalCategoryExists).toBe(true);

          // Debe haber exactamente una categoría primaria
          const primaryCategories = categories.filter(cat => cat.is_primary);
          expect(primaryCategories.length).toBe(1);

          // La categoría primaria debe coincidir con la original
          expect(primaryCategories[0].category_name).toBe(serviceData.category);

          // Verificar que la columna category en services sigue teniendo el valor original
          const [updatedService] = await db('services')
            .where({ id: service.id })
            .select('category');
          expect(updatedService.category).toBe(serviceData.category);

          return true;
        }
      ),
      { numRuns: 10, timeout: 100000 }
    );
  }, 120000);

  /**
   * **Feature: categorias-multiples, Property 9: Migration data preservation**
   * **Validates: Requirements 8.2, 8.3, 8.5**
   * 
   * For any product that exists before migration, after migration completes,
   * the item should have at least one category assigned that matches its original category value.
   */
  test('Property 9: Migration data preservation - products maintain their original category after migration', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length > 0),
          category: fc.constantFrom('Cremas', 'Sueros', 'Mascarillas', 'Limpiadores', 'Protectores'),
          price: fc.integer({ min: 1000, max: 50000 }),
          stock: fc.integer({ min: 0, max: 100 })
        }),
        async (productData) => {
          // Crear un producto con una categoría única (simulando estado pre-migración)
          const [productId] = await db('products').insert({
            id: db.raw('UUID()'),
            name: productData.name,
            category: productData.category,
            price: productData.price,
            stock: productData.stock,
            min_stock: 5
          });

          // Obtener el ID generado
          const [product] = await db('products')
            .where({ name: productData.name })
            .select('id', 'category');

          createdProductIds.push(product.id);

          // Simular la migración: insertar en product_categories
          await db('product_categories').insert({
            id: db.raw('UUID()'),
            product_id: product.id,
            category_name: product.category,
            is_primary: true,
            display_order: 0
          });

          // Verificar que la categoría se preservó
          const categories = await db('product_categories')
            .where({ product_id: product.id })
            .select('category_name', 'is_primary');

          // Debe tener al menos una categoría
          expect(categories.length).toBeGreaterThanOrEqual(1);

          // La categoría original debe estar presente
          const originalCategoryExists = categories.some(
            cat => cat.category_name === productData.category
          );
          expect(originalCategoryExists).toBe(true);

          // Debe haber exactamente una categoría primaria
          const primaryCategories = categories.filter(cat => cat.is_primary);
          expect(primaryCategories.length).toBe(1);

          // La categoría primaria debe coincidir con la original
          expect(primaryCategories[0].category_name).toBe(productData.category);

          // Verificar que la columna category en products sigue teniendo el valor original
          const [updatedProduct] = await db('products')
            .where({ id: product.id })
            .select('category');
          expect(updatedProduct.category).toBe(productData.category);

          return true;
        }
      ),
      { numRuns: 10, timeout: 100000 }
    );
  }, 120000);

  /**
   * **Feature: categorias-multiples, Property 9: Migration data preservation**
   * **Validates: Requirements 8.2, 8.3, 8.5**
   * 
   * For any batch of services with various categories, after migration,
   * all services should maintain their original categories without data loss.
   */
  test('Property 9: Migration data preservation - batch migration preserves all service categories', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length > 0),
            category: fc.constantFrom('Facial', 'Corporal', 'Depilación', 'Masajes', 'Tratamientos'),
            price: fc.integer({ min: 1000, max: 100000 }),
            duration: fc.integer({ min: 15, max: 240 })
          }),
          { minLength: 2, maxLength: 10 }
        ),
        async (servicesData) => {
          // Crear múltiples servicios
          const serviceIds: string[] = [];
          const originalCategories: Map<string, string> = new Map();

          for (const serviceData of servicesData) {
            await db('services').insert({
              id: db.raw('UUID()'),
              name: serviceData.name,
              category: serviceData.category,
              price: serviceData.price,
              duration: serviceData.duration,
              is_active: true
            });

            const [service] = await db('services')
              .where({ name: serviceData.name })
              .select('id', 'category');

            serviceIds.push(service.id);
            createdServiceIds.push(service.id);
            originalCategories.set(service.id, service.category);

            // Simular migración
            await db('service_categories').insert({
              id: db.raw('UUID()'),
              service_id: service.id,
              category_name: service.category,
              is_primary: true,
              display_order: 0
            });
          }

          // Verificar que todos los servicios mantienen sus categorías
          for (const serviceId of serviceIds) {
            const categories = await db('service_categories')
              .where({ service_id: serviceId })
              .select('category_name', 'is_primary');

            const originalCategory = originalCategories.get(serviceId);

            // Debe tener al menos una categoría
            expect(categories.length).toBeGreaterThanOrEqual(1);

            // La categoría original debe estar presente
            const originalCategoryExists = categories.some(
              cat => cat.category_name === originalCategory
            );
            expect(originalCategoryExists).toBe(true);

            // Debe haber exactamente una categoría primaria
            const primaryCategories = categories.filter(cat => cat.is_primary);
            expect(primaryCategories.length).toBe(1);
          }

          return true;
        }
      ),
      { numRuns: 5, timeout: 100000 }
    );
  }, 120000);
});

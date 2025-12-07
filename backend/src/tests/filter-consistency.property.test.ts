/**
 * Property-Based Tests for Filter Result Consistency
 * Feature: categorias-multiples
 */

import * as fc from 'fast-check';
import { ServiceModel } from '../models/Service';
import { ProductModel } from '../models/Product';
import db from '../config/database';

describe('Filter Result Consistency Property Tests', () => {
  jest.setTimeout(120000);

  const createdServiceIds: string[] = [];
  const createdProductIds: string[] = [];

  beforeAll(async () => {
    // Verificar que las tablas existen
    try {
      await db.raw('SELECT 1 FROM service_categories LIMIT 1');
      await db.raw('SELECT 1 FROM product_categories LIMIT 1');
    } catch (error) {
      console.warn('Category tables do not exist yet. Tests will be skipped.');
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
   * **Feature: categorias-multiples, Property 11: Filter result consistency**
   * **Validates: Requirements 3.3, 4.3**
   * 
   * For any service or product that appears in a category filter result, the returned
   * data should be identical regardless of which assigned category was used for filtering.
   */
  test('Property 11: Filter result consistency - service data is identical across category filters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length > 0),
          categories: fc.array(
            fc.constantFrom('Facial', 'Corporal', 'Depilación', 'Masajes', 'Tratamientos'),
            { minLength: 2, maxLength: 4 }
          ).map(cats => Array.from(new Set(cats))), // Remove duplicates
          price: fc.integer({ min: 1000, max: 100000 }),
          duration: fc.integer({ min: 15, max: 240 }),
          description: fc.string({ minLength: 10, maxLength: 200 })
        }),
        async (serviceData) => {
          // Create a service with multiple categories
          const [serviceId] = await db('services').insert({
            id: db.raw('UUID()'),
            name: serviceData.name,
            category: serviceData.categories[0],
            price: serviceData.price,
            duration: serviceData.duration,
            description: serviceData.description,
            is_active: true
          });

          const [service] = await db('services')
            .where({ name: serviceData.name })
            .select('id');

          createdServiceIds.push(service.id);

          // Insert categories
          await ServiceModel.updateCategories(service.id, serviceData.categories);

          // Filter by each assigned category and collect results
          const resultsByCategory: Map<string, any> = new Map();

          for (const category of serviceData.categories) {
            const filteredServices = await ServiceModel.getServicesByCategory(category);
            const matchingService = filteredServices.find(s => s.id === service.id);

            expect(matchingService).toBeDefined();
            resultsByCategory.set(category, matchingService);
          }

          // Verify that all results are identical
          const results = Array.from(resultsByCategory.values());
          const firstResult = results[0];

          for (let i = 1; i < results.length; i++) {
            const currentResult = results[i];

            // Compare key fields
            expect(currentResult.id).toBe(firstResult.id);
            expect(currentResult.name).toBe(firstResult.name);
            expect(currentResult.price).toBe(firstResult.price);
            expect(currentResult.duration).toBe(firstResult.duration);
            expect(currentResult.description).toBe(firstResult.description);
            expect(currentResult.category).toBe(firstResult.category);

            // Compare categories array
            expect(currentResult.categories).toEqual(firstResult.categories);

            // Verify categories array contains all assigned categories
            for (const cat of serviceData.categories) {
              expect(currentResult.categories).toContain(cat);
            }
          }

          return true;
        }
      ),
      { numRuns: 10, timeout: 100000 }
    );
  }, 120000);

  /**
   * **Feature: categorias-multiples, Property 11: Filter result consistency (Products)**
   * **Validates: Requirements 3.3, 4.3**
   * 
   * For any product that appears in a category filter result, the returned data should
   * be identical regardless of which assigned category was used for filtering.
   */
  test('Property 11: Filter result consistency - product data is identical across category filters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length > 0),
          categories: fc.array(
            fc.constantFrom('Cuidado Facial', 'Cuidado Corporal', 'Maquillaje', 'Accesorios'),
            { minLength: 2, maxLength: 3 }
          ).map(cats => Array.from(new Set(cats))),
          price: fc.integer({ min: 1000, max: 50000 }),
          stock: fc.integer({ min: 0, max: 100 }),
          description: fc.string({ minLength: 10, maxLength: 200 })
        }),
        async (productData) => {
          // Create a product with multiple categories
          const [productId] = await db('products').insert({
            id: db.raw('UUID()'),
            name: productData.name,
            category: productData.categories[0],
            price: productData.price,
            stock: productData.stock,
            min_stock: 5,
            description: productData.description
          });

          const [product] = await db('products')
            .where({ name: productData.name })
            .select('id');

          createdProductIds.push(product.id);

          // Insert categories
          await ProductModel.updateCategories(product.id, productData.categories);

          // Filter by each assigned category and collect results
          const resultsByCategory: Map<string, any> = new Map();

          for (const category of productData.categories) {
            const filteredProducts = await ProductModel.getProductsByCategory(category);
            const matchingProduct = filteredProducts.find(p => p.id === product.id);

            expect(matchingProduct).toBeDefined();
            resultsByCategory.set(category, matchingProduct);
          }

          // Verify that all results are identical
          const results = Array.from(resultsByCategory.values());
          const firstResult = results[0];

          for (let i = 1; i < results.length; i++) {
            const currentResult = results[i];

            // Compare key fields
            expect(currentResult.id).toBe(firstResult.id);
            expect(currentResult.name).toBe(firstResult.name);
            expect(currentResult.price).toBe(firstResult.price);
            expect(currentResult.stock).toBe(firstResult.stock);
            expect(currentResult.description).toBe(firstResult.description);
            expect(currentResult.category).toBe(firstResult.category);

            // Compare categories array
            expect(currentResult.categories).toEqual(firstResult.categories);

            // Verify categories array contains all assigned categories
            for (const cat of productData.categories) {
              expect(currentResult.categories).toContain(cat);
            }
          }

          return true;
        }
      ),
      { numRuns: 10, timeout: 100000 }
    );
  }, 120000);

  /**
   * Additional test: Verify that filtering by "all" returns the same data as individual filters
   */
  test('Property 11 (Extended): Services in "all" filter match individual category filters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length > 0),
            categories: fc.array(
              fc.constantFrom('Facial', 'Corporal', 'Depilación'),
              { minLength: 1, maxLength: 2 }
            ).map(cats => Array.from(new Set(cats))),
            price: fc.integer({ min: 1000, max: 100000 }),
            duration: fc.integer({ min: 15, max: 240 })
          }),
          { minLength: 3, maxLength: 6 }
        ),
        async (servicesData) => {
          // Create multiple services
          const serviceIdMap = new Map<string, string>();

          for (const serviceData of servicesData) {
            const [serviceId] = await db('services').insert({
              id: db.raw('UUID()'),
              name: serviceData.name,
              category: serviceData.categories[0],
              price: serviceData.price,
              duration: serviceData.duration,
              is_active: true
            });

            const [service] = await db('services')
              .where({ name: serviceData.name })
              .select('id');

            createdServiceIds.push(service.id);
            serviceIdMap.set(serviceData.name, service.id);

            await ServiceModel.updateCategories(service.id, serviceData.categories);
          }

          // Get all services
          const allServicesResult = await ServiceModel.findAll({ limit: 100 });
          const allServices = allServicesResult.services.filter(s => 
            createdServiceIds.includes(s.id)
          );

          // For each service, verify it appears in all its category filters with same data
          for (const service of allServices) {
            for (const category of service.categories) {
              const categoryServices = await ServiceModel.getServicesByCategory(category);
              const matchingService = categoryServices.find(s => s.id === service.id);

              expect(matchingService).toBeDefined();
              
              // Verify data consistency
              expect(matchingService!.name).toBe(service.name);
              expect(matchingService!.price).toBe(service.price);
              expect(matchingService!.duration).toBe(service.duration);
              expect(matchingService!.category).toBe(service.category);
              expect(matchingService!.categories).toEqual(service.categories);
            }
          }

          return true;
        }
      ),
      { numRuns: 5, timeout: 100000 }
    );
  }, 120000);
});

/**
 * Property-Based Tests for Service Categories Management
 * Feature: categorias-multiples
 */

import * as fc from 'fast-check';
import { ServiceModel } from '../models/Service';
import db from '../config/database';

describe('Service Categories Property Tests', () => {
  jest.setTimeout(120000);

  const createdServiceIds: string[] = [];

  beforeAll(async () => {
    // Verificar que las tablas existen
    try {
      await db.raw('SELECT 1 FROM service_categories LIMIT 1');
    } catch (error) {
      console.warn('service_categories table does not exist yet. Tests will be skipped.');
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
    } catch (error) {
      console.error('Error cleaning test data:', error);
    }
  }, 30000);

  afterAll(async () => {
    await db.destroy();
  });

  /**
   * **Feature: categorias-multiples, Property 2: At least one category required**
   * **Validates: Requirements 1.3, 2.3, 8.5**
   * 
   * For any service or product, there should always be at least one category assigned
   * in the junction table.
   */
  test('Property 2: At least one category required - services always have at least one category', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length > 0),
          category: fc.constantFrom('Facial', 'Corporal', 'Depilación', 'Masajes', 'Tratamientos'),
          price: fc.integer({ min: 1000, max: 100000 }),
          duration: fc.integer({ min: 15, max: 240 })
        }),
        async (serviceData) => {
          // Crear un servicio
          const [serviceId] = await db('services').insert({
            id: db.raw('UUID()'),
            name: serviceData.name,
            category: serviceData.category,
            price: serviceData.price,
            duration: serviceData.duration,
            is_active: true
          });

          const [service] = await db('services')
            .where({ name: serviceData.name })
            .select('id');

          createdServiceIds.push(service.id);

          // Agregar la categoría inicial
          await db('service_categories').insert({
            id: db.raw('UUID()'),
            service_id: service.id,
            category_name: serviceData.category,
            is_primary: true,
            display_order: 0
          });

          // Intentar remover la última categoría debería fallar
          await expect(
            ServiceModel.removeCategory(service.id, serviceData.category)
          ).rejects.toThrow('Cannot remove the last category');

          // Verificar que la categoría sigue ahí
          const categories = await db('service_categories')
            .where({ service_id: service.id })
            .select('category_name');

          expect(categories.length).toBeGreaterThanOrEqual(1);

          return true;
        }
      ),
      { numRuns: 10, timeout: 100000 }
    );
  }, 120000);

  /**
   * **Feature: categorias-multiples, Property 3: Exactly one primary category**
   * **Validates: Requirements 1.4, 2.4**
   * 
   * For any service or product with assigned categories, exactly one category should
   * be marked as is_primary=TRUE in the junction table.
   */
  test('Property 3: Exactly one primary category - services have exactly one primary category', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length > 0),
          categories: fc.array(
            fc.constantFrom('Facial', 'Corporal', 'Depilación', 'Masajes', 'Tratamientos', 'Anti-Edad'),
            { minLength: 2, maxLength: 4 }
          ).map(cats => Array.from(new Set(cats))), // Eliminar duplicados
          price: fc.integer({ min: 1000, max: 100000 }),
          duration: fc.integer({ min: 15, max: 240 })
        }),
        async (serviceData) => {
          // Crear un servicio
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

          // Agregar múltiples categorías usando updateCategories
          await ServiceModel.updateCategories(service.id, serviceData.categories);

          // Verificar que hay exactamente una categoría primaria
          const primaryCategories = await db('service_categories')
            .where({ service_id: service.id, is_primary: true })
            .select('category_name');

          expect(primaryCategories.length).toBe(1);

          // Verificar que la categoría primaria coincide con la primera del array
          expect(primaryCategories[0].category_name).toBe(serviceData.categories[0]);

          // Verificar que la columna category en services coincide con la primaria
          const [updatedService] = await db('services')
            .where({ id: service.id })
            .select('category');

          expect(updatedService.category).toBe(serviceData.categories[0]);

          return true;
        }
      ),
      { numRuns: 10, timeout: 100000 }
    );
  }, 120000);

  /**
   * **Feature: categorias-multiples, Property 5: No duplicate categories**
   * **Validates: Requirements 1.3, 2.3**
   * 
   * For any service or product, the same category name should not appear more than
   * once in the junction table for that item.
   */
  test('Property 5: No duplicate categories - services cannot have duplicate categories', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length > 0),
          category: fc.constantFrom('Facial', 'Corporal', 'Depilación', 'Masajes', 'Tratamientos'),
          price: fc.integer({ min: 1000, max: 100000 }),
          duration: fc.integer({ min: 15, max: 240 })
        }),
        async (serviceData) => {
          // Crear un servicio
          const [serviceId] = await db('services').insert({
            id: db.raw('UUID()'),
            name: serviceData.name,
            category: serviceData.category,
            price: serviceData.price,
            duration: serviceData.duration,
            is_active: true
          });

          const [service] = await db('services')
            .where({ name: serviceData.name })
            .select('id');

          createdServiceIds.push(service.id);

          // Agregar la categoría inicial
          await db('service_categories').insert({
            id: db.raw('UUID()'),
            service_id: service.id,
            category_name: serviceData.category,
            is_primary: true,
            display_order: 0
          });

          // Intentar agregar la misma categoría de nuevo debería fallar
          await expect(
            ServiceModel.addCategory(service.id, serviceData.category, false)
          ).rejects.toThrow('already assigned');

          // Verificar que solo hay una instancia de la categoría
          const categories = await db('service_categories')
            .where({ service_id: service.id, category_name: serviceData.category })
            .select('id');

          expect(categories.length).toBe(1);

          // Verificar que updateCategories elimina duplicados automáticamente
          const categoriesWithDuplicates = [
            serviceData.category,
            'Anti-Edad',
            serviceData.category, // Duplicado
            'Tratamientos'
          ];

          await ServiceModel.updateCategories(service.id, categoriesWithDuplicates);

          // Verificar que no hay duplicados
          const allCategories = await db('service_categories')
            .where({ service_id: service.id })
            .select('category_name');

          const categoryNames = allCategories.map(c => c.category_name);
          const uniqueNames = Array.from(new Set(categoryNames));

          expect(categoryNames.length).toBe(uniqueNames.length);

          return true;
        }
      ),
      { numRuns: 10, timeout: 100000 }
    );
  }, 120000);
});

  /**
   * **Feature: categorias-multiples, Property 1: Primary category consistency**
   * **Validates: Requirements 1.4, 2.4, 5.1**
   * 
   * For any service or product with assigned categories, the value in the category column
   * should always match the category marked as is_primary=TRUE in the junction table.
   */
  test('Property 1: Primary category consistency - category field matches primary category', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length > 0),
          categories: fc.array(
            fc.constantFrom('Facial', 'Corporal', 'Depilación', 'Masajes', 'Tratamientos', 'Anti-Edad'),
            { minLength: 1, maxLength: 4 }
          ).map(cats => Array.from(new Set(cats))),
          price: fc.integer({ min: 1000, max: 100000 }),
          duration: fc.integer({ min: 15, max: 240 })
        }),
        async (serviceData) => {
          // Crear un servicio con múltiples categorías
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
            .select('id', 'category');

          createdServiceIds.push(service.id);

          // Insertar categorías
          await ServiceModel.updateCategories(service.id, serviceData.categories);

          // Verificar consistencia
          const [primaryCategory] = await db('service_categories')
            .where({ service_id: service.id, is_primary: true })
            .select('category_name');

          const [updatedService] = await db('services')
            .where({ id: service.id })
            .select('category');

          // La categoría primaria en la tabla de unión debe coincidir con la columna category
          expect(primaryCategory.category_name).toBe(updatedService.category);

          // La categoría primaria debe ser la primera del array
          expect(primaryCategory.category_name).toBe(serviceData.categories[0]);

          return true;
        }
      ),
      { numRuns: 10, timeout: 100000 }
    );
  }, 120000);

  /**
   * **Feature: categorias-multiples, Property 4: Category filter completeness**
   * **Validates: Requirements 3.1, 4.1**
   * 
   * For any category name, filtering services or products by that category should return
   * all items that have that category assigned, regardless of whether it's primary or secondary.
   */
  test('Property 4: Category filter completeness - filters return all services with category', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          services: fc.array(
            fc.record({
              name: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length > 0),
              categories: fc.array(
                fc.constantFrom('Facial', 'Corporal', 'Depilación', 'Masajes', 'Tratamientos'),
                { minLength: 1, maxLength: 3 }
              ).map(cats => Array.from(new Set(cats))),
              price: fc.integer({ min: 1000, max: 100000 }),
              duration: fc.integer({ min: 15, max: 240 })
            }),
            { minLength: 3, maxLength: 8 }
          ),
          filterCategory: fc.constantFrom('Facial', 'Corporal', 'Depilación', 'Masajes', 'Tratamientos')
        }),
        async ({ services, filterCategory }) => {
          // Crear servicios
          const serviceIds: string[] = [];
          const expectedServiceNames: string[] = [];

          for (const serviceData of services) {
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

            serviceIds.push(service.id);
            createdServiceIds.push(service.id);

            // Insertar categorías
            await ServiceModel.updateCategories(service.id, serviceData.categories);

            // Si el servicio tiene la categoría de filtro, debe aparecer en resultados
            if (serviceData.categories.includes(filterCategory)) {
              expectedServiceNames.push(serviceData.name);
            }
          }

          // Filtrar por categoría
          const filteredServices = await ServiceModel.getServicesByCategory(filterCategory);
          const filteredNames = filteredServices.map(s => s.name);

          // Todos los servicios esperados deben estar en los resultados
          for (const expectedName of expectedServiceNames) {
            expect(filteredNames).toContain(expectedName);
          }

          // No debe haber servicios extra (que no tengan la categoría)
          for (const filteredName of filteredNames) {
            expect(expectedServiceNames).toContain(filteredName);
          }

          return true;
        }
      ),
      { numRuns: 5, timeout: 100000 }
    );
  }, 120000);

  /**
   * **Feature: categorias-multiples, Property 10: Category persistence completeness**
   * **Validates: Requirements 1.2, 1.3, 2.2, 2.3**
   * 
   * For any service or product created or updated with multiple categories, retrieving
   * that item from the database should return all assigned categories in the same order.
   */
  test('Property 10: Category persistence completeness - categories persist correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length > 0),
          categories: fc.array(
            fc.constantFrom('Facial', 'Corporal', 'Depilación', 'Masajes', 'Tratamientos', 'Anti-Edad'),
            { minLength: 2, maxLength: 5 }
          ).map(cats => Array.from(new Set(cats))),
          price: fc.integer({ min: 1000, max: 100000 }),
          duration: fc.integer({ min: 15, max: 240 })
        }),
        async (serviceData) => {
          // Crear un servicio
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

          // Insertar categorías
          await ServiceModel.updateCategories(service.id, serviceData.categories);

          // Recuperar el servicio
          const retrievedService = await ServiceModel.findById(service.id);

          // Verificar que todas las categorías están presentes
          expect(retrievedService).not.toBeNull();
          expect(retrievedService!.categories).toHaveLength(serviceData.categories.length);

          // Verificar que las categorías están en el mismo orden
          for (let i = 0; i < serviceData.categories.length; i++) {
            expect(retrievedService!.categories[i]).toBe(serviceData.categories[i]);
          }

          // Verificar que la categoría primaria es la primera
          expect(retrievedService!.category).toBe(serviceData.categories[0]);

          return true;
        }
      ),
      { numRuns: 10, timeout: 100000 }
    );
  }, 120000);
});

  /**
   * **Feature: categorias-multiples, Property 7: Statistics counting accuracy**
   * **Validates: Requirements 7.1, 7.2, 7.3**
   * 
   * For any category, the count of services or products in that category should equal
   * the number of distinct items that have that category assigned (primary or secondary).
   */
  test('Property 7: Statistics counting accuracy - category counts are accurate', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length > 0),
            categories: fc.array(
              fc.constantFrom('Facial', 'Corporal', 'Depilación', 'Masajes', 'Tratamientos'),
              { minLength: 1, maxLength: 3 }
            ).map(cats => Array.from(new Set(cats))),
            price: fc.integer({ min: 1000, max: 100000 }),
            duration: fc.integer({ min: 15, max: 240 })
          }),
          { minLength: 5, maxLength: 10 }
        ),
        async (servicesData) => {
          // Crear servicios con múltiples categorías
          const expectedCounts = new Map<string, Set<string>>();

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

            // Insertar categorías
            await ServiceModel.updateCategories(service.id, serviceData.categories);

            // Contar manualmente para verificar
            for (const category of serviceData.categories) {
              if (!expectedCounts.has(category)) {
                expectedCounts.set(category, new Set());
              }
              expectedCounts.get(category)!.add(service.id);
            }
          }

          // Obtener estadísticas del sistema
          const categories = await ServiceModel.getCategories();

          // Verificar que los conteos coinciden
          for (const [categoryName, serviceIds] of expectedCounts.entries()) {
            const categoryStats = categories.find(c => c.name === categoryName);
            
            if (categoryStats) {
              expect(categoryStats.serviceCount).toBe(serviceIds.size);
            }
          }

          return true;
        }
      ),
      { numRuns: 5, timeout: 100000 }
    );
  }, 120000);
});

  /**
   * **Feature: categorias-multiples, Property 8: Backward compatibility preservation**
   * **Validates: Requirements 5.2**
   * 
   * For any existing API endpoint that returns service or product data, the response should
   * include both the category field (string) and categories field (array), where category
   * equals the first element of categories.
   */
  test('Property 8: Backward compatibility - API responses include both fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length > 0),
          categories: fc.array(
            fc.constantFrom('Facial', 'Corporal', 'Depilación', 'Masajes', 'Tratamientos'),
            { minLength: 1, maxLength: 3 }
          ).map(cats => Array.from(new Set(cats))),
          price: fc.integer({ min: 1000, max: 100000 }),
          duration: fc.integer({ min: 15, max: 240 })
        }),
        async (serviceData) => {
          // Crear un servicio
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

          // Insertar categorías
          await ServiceModel.updateCategories(service.id, serviceData.categories);

          // Recuperar el servicio (simula respuesta de API)
          const retrievedService = await ServiceModel.findById(service.id);

          // Verificar que ambos campos existen
          expect(retrievedService).not.toBeNull();
          expect(retrievedService!.category).toBeDefined();
          expect(retrievedService!.categories).toBeDefined();

          // Verificar que category es un string
          expect(typeof retrievedService!.category).toBe('string');

          // Verificar que categories es un array
          expect(Array.isArray(retrievedService!.categories)).toBe(true);

          // Verificar que category equals categories[0]
          expect(retrievedService!.category).toBe(retrievedService!.categories[0]);

          return true;
        }
      ),
      { numRuns: 10, timeout: 100000 }
    );
  }, 120000);

  /**
   * **Feature: categorias-multiples, Property 12: API response structure consistency**
   * **Validates: Requirements 5.2, 5.3**
   * 
   * For any API response containing service or product data, both the category field and
   * categories array field should be present, and the category value should equal the first
   * element of the categories array.
   */
  test('Property 12: API response structure - consistent structure across all responses', async () => {
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
          { minLength: 2, maxLength: 5 }
        ),
        async (servicesData) => {
          // Crear múltiples servicios
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
            await ServiceModel.updateCategories(service.id, serviceData.categories);
          }

          // Recuperar todos los servicios (simula endpoint findAll)
          const result = await ServiceModel.findAll({ limit: 100 });

          // Verificar que todos los servicios tienen la estructura correcta
          for (const service of result.services) {
            expect(service.category).toBeDefined();
            expect(service.categories).toBeDefined();
            expect(typeof service.category).toBe('string');
            expect(Array.isArray(service.categories)).toBe(true);
            expect(service.category).toBe(service.categories[0]);
          }

          return true;
        }
      ),
      { numRuns: 5, timeout: 100000 }
    );
  }, 120000);
});

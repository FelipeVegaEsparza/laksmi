/**
 * Property-Based Tests for Client Creation
 * Feature: chatbot-whatsapp-revision
 */

import * as fc from 'fast-check';
import { ClientModel } from '../models/Client';
import db from '../config/database';

describe('Client Creation Property Tests', () => {
  // Aumentar timeout para operaciones de base de datos
  jest.setTimeout(60000);

  // Limpiar solo los clientes creados en los tests
  const createdClientIds: string[] = [];

  afterEach(async () => {
    try {
      if (createdClientIds.length > 0) {
        await db('conversations').whereIn('client_id', createdClientIds).del();
        await db('bookings').whereIn('client_id', createdClientIds).del();
        await db('clients').whereIn('id', createdClientIds).del();
        createdClientIds.length = 0;
      }
    } catch (error) {
      console.error('Error cleaning test data:', error);
    }
  }, 30000);

  afterAll(async () => {
    await db.destroy();
  });

  /**
   * **Feature: chatbot-whatsapp-revision, Property 2: Unknown number client creation**
   * **Validates: Requirements 1.2**
   * 
   * For any message from an unknown phone number, the system should automatically 
   * create a new client record in the database with that phone number.
   */
  test('Property 2: Unknown number client creation - creating a client with a new phone number should succeed', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generador de números de teléfono válidos en formato internacional
        fc.record({
          phone: fc.oneof(
            // Formato chileno: +56912345678
            fc.tuple(
              fc.constant('+569'),
              fc.integer({ min: 10000000, max: 99999999 })
            ).map(([prefix, num]) => `${prefix}${num}`),
            // Formato internacional genérico: +1234567890
            fc.tuple(
              fc.constantFrom('+1', '+44', '+34', '+52', '+54'),
              fc.integer({ min: 1000000000, max: 9999999999 })
            ).map(([prefix, num]) => `${prefix}${num}`)
          ),
          name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          email: fc.option(
            fc.emailAddress(),
            { nil: null }
          )
        }),
        async (clientData) => {
          // Verificar que el cliente no existe antes de crearlo
          const existingClient = await ClientModel.findByPhone(clientData.phone);
          
          // Si ya existe (por alguna razón), saltar esta iteración
          if (existingClient) {
            return true;
          }

          // Crear el cliente
          const createdClient = await ClientModel.create({
            phone: clientData.phone,
            name: clientData.name,
            email: clientData.email || undefined,
            allergies: [],
            preferences: []
          });

          // Guardar ID para limpieza
          createdClientIds.push(createdClient.id);

          // Verificar que el cliente fue creado correctamente
          expect(createdClient).toBeDefined();
          expect(createdClient.phone).toBe(clientData.phone);
          expect(createdClient.name).toBe(clientData.name);
          
          // Verificar que el cliente puede ser encontrado en la base de datos
          const foundClient = await ClientModel.findByPhone(clientData.phone);
          expect(foundClient).toBeDefined();
          expect(foundClient?.id).toBe(createdClient.id);
          expect(foundClient?.phone).toBe(clientData.phone);

          return true;
        }
      ),
      { numRuns: 10, timeout: 50000 } // Reducido para pruebas iniciales
    );
  }, 60000);

  /**
   * **Feature: chatbot-whatsapp-revision, Property 2: Unknown number client creation**
   * **Validates: Requirements 1.2**
   * 
   * For any message from an unknown phone number, attempting to create a duplicate
   * should return the existing client instead of failing.
   */
  test('Property 2: Unknown number client creation - attempting to create duplicate should return existing client', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          phone: fc.tuple(
            fc.constant('+569'),
            fc.integer({ min: 10000000, max: 99999999 })
          ).map(([prefix, num]) => `${prefix}${num}`),
          name1: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          name2: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)
        }),
        async ({ phone, name1, name2 }) => {
          // Crear el primer cliente
          const client1 = await ClientModel.create({
            phone,
            name: name1,
            allergies: [],
            preferences: []
          });

          // Guardar ID para limpieza
          createdClientIds.push(client1.id);

          // Intentar crear un segundo cliente con el mismo teléfono
          const client2 = await ClientModel.create({
            phone,
            name: name2, // Nombre diferente
            allergies: [],
            preferences: []
          });

          // Ambos deben ser el mismo cliente (mismo ID)
          expect(client1.id).toBe(client2.id);
          expect(client1.phone).toBe(client2.phone);
          expect(client1.phone).toBe(phone);

          // Verificar que solo existe un cliente con ese teléfono en la base de datos
          const allClients = await db('clients').where({ phone });
          expect(allClients).toHaveLength(1);

          return true;
        }
      ),
      { numRuns: 10, timeout: 50000 } // Reducido para pruebas iniciales
    );
  }, 60000);

  /**
   * **Feature: chatbot-whatsapp-revision, Property 2: Unknown number client creation**
   * **Validates: Requirements 1.2**
   * 
   * For any set of concurrent requests to create clients with the same phone number,
   * only one client should be created (race condition handling).
   */
  test('Property 2: Unknown number client creation - concurrent creation attempts should not create duplicates', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          phone: fc.tuple(
            fc.constant('+569'),
            fc.integer({ min: 10000000, max: 99999999 })
          ).map(([prefix, num]) => `${prefix}${num}`),
          names: fc.array(
            fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            { minLength: 2, maxLength: 5 }
          )
        }),
        async ({ phone, names }) => {
          // Intentar crear múltiples clientes con el mismo teléfono concurrentemente
          const createPromises = names.map(name =>
            ClientModel.create({
              phone,
              name,
              allergies: [],
              preferences: []
            })
          );

          const clients = await Promise.all(createPromises);

          // Guardar ID para limpieza
          if (clients.length > 0) {
            createdClientIds.push(clients[0].id);
          }

          // Todos deben tener el mismo ID (mismo cliente)
          const uniqueIds = new Set(clients.map(c => c.id));
          expect(uniqueIds.size).toBe(1);

          // Verificar que solo existe un cliente con ese teléfono en la base de datos
          const allClients = await db('clients').where({ phone });
          expect(allClients).toHaveLength(1);

          return true;
        }
      ),
      { numRuns: 5, timeout: 50000 } // Reducido para pruebas iniciales
    );
  }, 60000);
});

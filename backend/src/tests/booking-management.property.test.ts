/**
 * Property-Based Tests for Booking Management System
 * Feature: chatbot-whatsapp-revision
 */

import * as fc from 'fast-check';
import { BookingManagementService } from '../services/ai/BookingManagementService';
import { BookingModel } from '../models/Booking';
import { ClientModel } from '../models/Client';
import { ServiceModel } from '../models/Service';
import { ConversationModel } from '../models/Conversation';
import { ContextManager } from '../services/ai/ContextManager';
import db from '../config/database';

describe('Booking Management Property Tests', () => {
  jest.setTimeout(30000);

  const createdClientIds: string[] = [];
  const createdServiceIds: string[] = [];
  const createdBookingIds: string[] = [];
  const createdConversationIds: string[] = [];

  afterEach(async () => {
    try {
      // Clean up in reverse order of dependencies
      if (createdBookingIds.length > 0) {
        await db('bookings').whereIn('id', createdBookingIds).del();
        createdBookingIds.length = 0;
      }
      if (createdConversationIds.length > 0) {
        await db('messages').whereIn('conversation_id', createdConversationIds).del();
        await db('conversations').whereIn('id', createdConversationIds).del();
        createdConversationIds.length = 0;
      }
      if (createdServiceIds.length > 0) {
        await db('services').whereIn('id', createdServiceIds).del();
        createdServiceIds.length = 0;
      }
      if (createdClientIds.length > 0) {
        await db('clients').whereIn('id', createdClientIds).del();
        createdClientIds.length = 0;
      }
    } catch (error) {
      console.error('Error cleaning test data:', error);
    }
  }, 15000);

  afterAll(async () => {
    try {
      await db.destroy();
    } catch (error) {
      console.error('Error destroying database connection:', error);
    }
  });

  /**
   * **Feature: chatbot-whatsapp-revision, Property 16: Complete booking list retrieval**
   * **Validates: Requirements 5.1**
   * 
   * For any client requesting to see their bookings, the system should return 
   * all active bookings for that client.
   */
  test('Property 16: Complete booking list retrieval - all active bookings returned', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          phone: fc.tuple(
            fc.constant('+569'),
            fc.integer({ min: 10000000, max: 99999999 })
          ).map(([prefix, num]) => `${prefix}${num}`),
          name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          bookingCount: fc.integer({ min: 1, max: 3 })
        }),
        async ({ phone, name, bookingCount }) => {
          try {
            // Create client
            const client = await ClientModel.create({
              phone,
              name,
              allergies: [],
              preferences: []
            });
            createdClientIds.push(client.id);

            // Create a service
            const service = await ServiceModel.create({
              name: `Test Service ${Date.now()}`,
              category: 'Facial',
              price: 50000,
              duration: 60,
              description: 'Test service',
              isActive: true
            });
            createdServiceIds.push(service.id);

            // Create multiple future bookings with active statuses
            const activeStatuses: ('confirmed' | 'pending_payment')[] = ['confirmed', 'pending_payment'];
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 7); // 7 days in the future

            for (let i = 0; i < bookingCount; i++) {
              const bookingDate = new Date(futureDate);
              bookingDate.setHours(10 + i, 0, 0, 0);

              const booking = await BookingModel.create({
                clientId: client.id,
                serviceId: service.id,
                dateTime: bookingDate,
                status: activeStatuses[i % activeStatuses.length]
              });
              createdBookingIds.push(booking.id);
            }

            // Get client bookings
            const bookings = await BookingManagementService.getClientActiveBookings(client.id);

            // Should return all created bookings
            expect(bookings.length).toBe(bookingCount);

            // All bookings should be for this client
            bookings.forEach(booking => {
              expect(booking.clientId).toBe(client.id);
              expect(activeStatuses).toContain(booking.status);
              expect(new Date(booking.dateTime).getTime()).toBeGreaterThan(Date.now());
            });

            return true;
          } catch (error) {
            console.error('Test error:', error);
            throw error;
          }
        }
      ),
      { numRuns: 1, timeout: 30000 }
    );
  }, 60000);

  /**
   * **Feature: chatbot-whatsapp-revision, Property 17: Confirmation without authentication**
   * **Validates: Requirements 5.2**
   * 
   * For any booking confirmation request, the system should update the booking status 
   * without requiring authentication.
   */
  test('Property 17: Confirmation without authentication - confirms without auth check', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          phone: fc.tuple(
            fc.constant('+569'),
            fc.integer({ min: 10000000, max: 99999999 })
          ).map(([prefix, num]) => `${prefix}${num}`),
          name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)
        }),
        async ({ phone, name }) => {
          try {
            // Create client
            const client = await ClientModel.create({
              phone,
              name,
              allergies: [],
              preferences: []
            });
            createdClientIds.push(client.id);

            // Create a service
            const service = await ServiceModel.create({
              name: `Test Service ${Date.now()}`,
              category: 'Facial',
              price: 50000,
              duration: 60,
              description: 'Test service',
              isActive: true
            });
            createdServiceIds.push(service.id);

            // Create a pending_payment booking (which can be confirmed)
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 7);
            futureDate.setHours(10, 0, 0, 0);

            const booking = await BookingModel.create({
              clientId: client.id,
              serviceId: service.id,
              dateTime: futureDate,
              status: 'pending_payment'
            });
            createdBookingIds.push(booking.id);

            // Confirm booking without any authentication context
            const result = await BookingManagementService.confirmBooking(
              booking.id,
              client.id
            );

            // Should succeed without authentication
            expect(result.success).toBe(true);
            expect(result.booking).toBeDefined();
            expect(result.booking.status).toBe('confirmed');
            expect(result.message).toBeTruthy();

            return true;
          } catch (error) {
            console.error('Test error:', error);
            throw error;
          }
        }
      ),
      { numRuns: 1, timeout: 30000 }
    );
  }, 60000);

  /**
   * **Feature: chatbot-whatsapp-revision, Property 19: Clarification for multiple bookings**
   * **Validates: Requirements 5.5**
   * 
   * For any client with multiple active bookings attempting a booking action, 
   * the system should request clarification about which booking to manage.
   */
  test('Property 19: Clarification for multiple bookings - requests clarification when multiple exist', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          phone: fc.tuple(
            fc.constant('+569'),
            fc.integer({ min: 10000000, max: 99999999 })
          ).map(([prefix, num]) => `${prefix}${num}`),
          name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)
        }),
        async ({ phone, name }) => {
          try {
            // Create client
            const client = await ClientModel.create({
              phone,
              name,
              allergies: [],
              preferences: []
            });
            createdClientIds.push(client.id);

            // Create a service
            const service = await ServiceModel.create({
              name: `Test Service ${Date.now()}`,
              category: 'Facial',
              price: 50000,
              duration: 60,
              description: 'Test service',
              isActive: true
            });
            createdServiceIds.push(service.id);

            // Create multiple future bookings
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 7);

            const booking1 = await BookingModel.create({
              clientId: client.id,
              serviceId: service.id,
              dateTime: new Date(futureDate.getTime()),
              status: 'confirmed'
            });
            createdBookingIds.push(booking1.id);

            const booking2Date = new Date(futureDate);
            booking2Date.setDate(booking2Date.getDate() + 1);
            const booking2 = await BookingModel.create({
              clientId: client.id,
              serviceId: service.id,
              dateTime: booking2Date,
              status: 'pending_payment'
            });
            createdBookingIds.push(booking2.id);

            // List bookings - should show multiple and ask for clarification
            const result = await BookingManagementService.listClientBookings(client.id);

            // Should succeed
            expect(result.success).toBe(true);
            
            // Should return multiple bookings
            expect(Array.isArray(result.booking)).toBe(true);
            expect(result.booking.length).toBeGreaterThanOrEqual(2);

            // Message should indicate multiple bookings and ask for clarification
            expect(result.message).toBeTruthy();
            expect(result.message.toLowerCase()).toMatch(/reserva|cita|booking/);
            
            // Should provide guidance on how to select
            expect(result.message.toLowerCase()).toMatch(/número|servicio|gestionar|dime/);

            return true;
          } catch (error) {
            console.error('Test error:', error);
            throw error;
          }
        }
      ),
      { numRuns: 1, timeout: 30000 }
    );
  }, 60000);
});

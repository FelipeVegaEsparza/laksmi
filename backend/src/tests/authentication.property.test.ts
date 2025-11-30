/**
 * Property-Based Tests for Authentication System
 * Feature: chatbot-whatsapp-revision
 */

import * as fc from 'fast-check';
import { ChatAuthService } from '../services/ai/ChatAuthService';
import { ClientModel } from '../models/Client';
import { ConversationModel } from '../models/Conversation';
import { ContextManager } from '../services/ai/ContextManager';
import db from '../config/database';

describe('Authentication Property Tests', () => {
  jest.setTimeout(30000);

  const createdClientIds: string[] = [];
  const createdConversationIds: string[] = [];

  afterEach(async () => {
    try {
      // Clean up in reverse order of dependencies
      if (createdConversationIds.length > 0) {
        await db('messages').whereIn('conversation_id', createdConversationIds).del();
        await db('conversations').whereIn('id', createdConversationIds).del();
        createdConversationIds.length = 0;
      }
      if (createdClientIds.length > 0) {
        await db('bookings').whereIn('client_id', createdClientIds).del();
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
   * **Feature: chatbot-whatsapp-revision, Property 18: Authentication requirement for sensitive actions**
   * **Validates: Requirements 5.3, 5.4**
   * 
   * For any request to cancel or reschedule a booking, the system should require 
   * authentication before proceeding.
   */
  test('Property 18: Authentication requirement for sensitive actions - cancel and reschedule require auth', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          phone: fc.tuple(
            fc.constant('+569'),
            fc.integer({ min: 10000000, max: 99999999 })
          ).map(([prefix, num]) => `${prefix}${num}`),
          name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          action: fc.constantFrom('cancel', 'reschedule')
        }),
        async ({ phone, name, action }) => {
          let client, conversation;
          try {
            // Create client
            client = await ClientModel.create({
              phone,
              name,
              allergies: [],
              preferences: []
            });
            createdClientIds.push(client.id);

            // Create conversation
            conversation = await ConversationModel.create(client.id, 'whatsapp');
            createdConversationIds.push(conversation.id);

            // Verify that sensitive action requires authentication
            const authResult = await ChatAuthService.verifyClientForSensitiveAction(
              client.id,
              conversation.id,
              action as 'cancel' | 'reschedule'
            );

            // Should require verification (not verified initially)
            expect(authResult.requiresVerification).toBe(true);
            expect(authResult.isVerified).toBe(false);
            expect(authResult.message).toBeTruthy();
            expect(['phone', 'email']).toContain(authResult.verificationMethod);

            return true;
          } catch (error) {
            console.error('Test error:', error);
            throw error;
          }
        }
      ),
      { numRuns: 5, timeout: 20000 }
    );
  }, 30000);

  /**
   * **Feature: chatbot-whatsapp-revision, Property 20: Verification request for sensitive actions**
   * **Validates: Requirements 6.1, 6.2**
   * 
   * For any attempt to cancel or reschedule a booking, the system should initiate 
   * a verification process (phone or email).
   */
  test('Property 20: Verification request for sensitive actions - system initiates verification', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          phone: fc.tuple(
            fc.constant('+569'),
            fc.integer({ min: 10000000, max: 99999999 })
          ).map(([prefix, num]) => `${prefix}${num}`),
          name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          email: fc.option(fc.emailAddress(), { nil: null }),
          action: fc.constantFrom('cancel_booking', 'reschedule_booking')
        }),
        async ({ phone, name, email, action }) => {
          try {
            // Create client with or without email
            const client = await ClientModel.create({
              phone,
              name,
              email: email || undefined,
              allergies: [],
              preferences: []
            });
            createdClientIds.push(client.id);

            // Create conversation
            const conversation = await ConversationModel.create(client.id, 'whatsapp');
            createdConversationIds.push(conversation.id);

            // Request verification
            const authResult = await ChatAuthService.verifyClientForSensitiveAction(
              client.id,
              conversation.id,
              action
            );

            // Should initiate verification
            expect(authResult.requiresVerification).toBe(true);
            expect(authResult.isVerified).toBe(false);
            
            // Should have a verification method
            expect(authResult.verificationMethod).toBeDefined();
            expect(['phone', 'email']).toContain(authResult.verificationMethod);

            // Should have a message explaining the verification
            expect(authResult.message).toBeTruthy();
            expect(authResult.message.length).toBeGreaterThan(10);

            // If email exists, should use email verification (level 2)
            if (email) {
              expect(authResult.verificationMethod).toBe('email');
            }

            return true;
          } catch (error) {
            console.error('Test error:', error);
            throw error;
          }
        }
      ),
      { numRuns: 5, timeout: 20000 }
    );
  }, 30000);

  /**
   * **Feature: chatbot-whatsapp-revision, Property 21: Code validation and action execution**
   * **Validates: Requirements 6.3**
   * 
   * For any verification code provided by a user, the system should validate the code 
   * and only proceed with the action if validation succeeds.
   */
  test('Property 21: Code validation and action execution - invalid code rejects action', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          phone: fc.tuple(
            fc.constant('+569'),
            fc.integer({ min: 10000000, max: 99999999 })
          ).map(([prefix, num]) => `${prefix}${num}`),
          name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          email: fc.emailAddress()
        }),
        async ({ phone, name, email }) => {
          try {
            // Create client with email
            const client = await ClientModel.create({
              phone,
              name,
              email,
              allergies: [],
              preferences: []
            });
            createdClientIds.push(client.id);

            // Create conversation
            const conversation = await ConversationModel.create(client.id, 'whatsapp');
            createdConversationIds.push(conversation.id);

            // Request verification (this generates a code)
            const authResult = await ChatAuthService.verifyClientForSensitiveAction(
              client.id,
              conversation.id,
              'cancel_booking'
            );

            // Should have a verification token
            expect(authResult.verificationToken).toBeDefined();

            // Get the verification token from context
            const verificationToken = await ContextManager.getVariable(
              conversation.id,
              'verificationToken'
            );
            expect(verificationToken).toBeTruthy();

            // Test with invalid code
            const invalidResult = await ChatAuthService.validateVerificationCode(
              conversation.id,
              '000000'
            );
            expect(invalidResult.isValid).toBe(false);
            expect(invalidResult.clientVerified).toBeFalsy();
            expect(invalidResult.message).toBeTruthy();

            return true;
          } catch (error) {
            console.error('Test error:', error);
            throw error;
          }
        }
      ),
      { numRuns: 3, timeout: 15000 }
    );
  }, 25000);

  /**
   * **Feature: chatbot-whatsapp-revision, Property 22: Phone number verification**
   * **Validates: Requirements 6.4**
   * 
   * For any phone number provided for verification, the system should validate that 
   * it matches the registered phone number for that client.
   */
  test('Property 22: Phone number verification - matching phone validates successfully', async () => {
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

            // Create conversation
            const conversation = await ConversationModel.create(client.id, 'whatsapp');
            createdConversationIds.push(conversation.id);

            // Request phone verification
            const authResult = await ChatAuthService.verifyClientForSensitiveAction(
              client.id,
              conversation.id,
              'view_my_bookings' // Level 1 action (phone verification)
            );

            expect(authResult.verificationMethod).toBe('phone');

            // Validate with correct phone (saying "yes")
            const validationResult = await ChatAuthService.validatePhoneVerification(
              conversation.id,
              client.id,
              'sí'
            );

            expect(validationResult.isVerified).toBe(true);
            expect(validationResult.requiresVerification).toBe(false);

            // Check that verification level was set
            const verificationLevel = await ContextManager.getVariable(
              conversation.id,
              'verificationLevel'
            );
            expect(verificationLevel).toBe(1);

            return true;
          } catch (error) {
            console.error('Test error:', error);
            throw error;
          }
        }
      ),
      { numRuns: 5, timeout: 20000 }
    );
  }, 30000);

  /**
   * **Feature: chatbot-whatsapp-revision, Property 22: Phone number verification**
   * **Validates: Requirements 6.4**
   * 
   * For any phone number provided for verification that doesn't match, 
   * the system should reject the verification.
   */
  test('Property 22: Phone number verification - non-matching phone fails validation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          phone: fc.tuple(
            fc.constant('+569'),
            fc.integer({ min: 10000000, max: 99999999 })
          ).map(([prefix, num]) => `${prefix}${num}`),
          wrongPhone: fc.tuple(
            fc.constant('+569'),
            fc.integer({ min: 10000000, max: 99999999 })
          ).map(([prefix, num]) => `${prefix}${num}`),
          name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)
        }).filter(({ phone, wrongPhone }) => phone !== wrongPhone), // Ensure phones are different
        async ({ phone, wrongPhone, name }) => {
          try {
            // Create client
            const client = await ClientModel.create({
              phone,
              name,
              allergies: [],
              preferences: []
            });
            createdClientIds.push(client.id);

            // Create conversation
            const conversation = await ConversationModel.create(client.id, 'whatsapp');
            createdConversationIds.push(conversation.id);

            // Request phone verification
            await ChatAuthService.verifyClientForSensitiveAction(
              client.id,
              conversation.id,
              'view_my_bookings'
            );

            // Validate with wrong phone
            const validationResult = await ChatAuthService.validatePhoneVerification(
              conversation.id,
              client.id,
              wrongPhone
            );

            expect(validationResult.isVerified).toBe(false);
            expect(validationResult.requiresVerification).toBe(true);

            return true;
          } catch (error) {
            console.error('Test error:', error);
            throw error;
          }
        }
      ),
      { numRuns: 5, timeout: 20000 }
    );
  }, 30000);

  /**
   * **Feature: chatbot-whatsapp-revision, Property 23: Action blocking on verification failure**
   * **Validates: Requirements 6.5**
   * 
   * For any failed verification attempt, the system should inform the user and 
   * not execute the sensitive action.
   */
  test('Property 23: Action blocking on verification failure - failed verification blocks action', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          phone: fc.tuple(
            fc.constant('+569'),
            fc.integer({ min: 10000000, max: 99999999 })
          ).map(([prefix, num]) => `${prefix}${num}`),
          name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          wrongCode: fc.string({ minLength: 6, maxLength: 6 }).filter(s => /^\d{6}$/.test(s))
        }),
        async ({ phone, name, wrongCode }) => {
          try {
            // Create client with email
            const client = await ClientModel.create({
              phone,
              name,
              email: 'test@example.com',
              allergies: [],
              preferences: []
            });
            createdClientIds.push(client.id);

            // Create conversation
            const conversation = await ConversationModel.create(client.id, 'whatsapp');
            createdConversationIds.push(conversation.id);

            // Request verification
            await ChatAuthService.verifyClientForSensitiveAction(
              client.id,
              conversation.id,
              'cancel_booking'
            );

            // Try with wrong code
            const validationResult = await ChatAuthService.validateVerificationCode(
              conversation.id,
              wrongCode
            );

            // Should fail validation
            expect(validationResult.isValid).toBe(false);
            expect(validationResult.clientVerified).toBeFalsy();
            expect(validationResult.message).toBeTruthy();

            // Verification level should still be 0 (not verified)
            const verificationLevel = await ContextManager.getVariable(
              conversation.id,
              'verificationLevel'
            );
            expect(verificationLevel || 0).toBe(0);

            return true;
          } catch (error) {
            console.error('Test error:', error);
            throw error;
          }
        }
      ),
      { numRuns: 5, timeout: 20000 }
    );
  }, 30000);
});

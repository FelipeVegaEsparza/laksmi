/**
 * Integration test for HumanTakeoverService.isUnderHumanControl()
 * Tests the database-backed implementation
 */

import { HumanTakeoverService } from '../services/ai/HumanTakeoverService';
import { ConversationModel } from '../models/Conversation';
import { ClientModel } from '../models/Client';
import db from '../config/database';

describe('HumanTakeoverService.isUnderHumanControl() - Database Integration', () => {
  let testConversationId: string;
  let testClientId: string;

  beforeAll(async () => {
    // Create test client
    const client = await ClientModel.create({
      name: 'Test Client',
      phone: '+1234567890',
      email: 'test@example.com'
    });
    testClientId = client.id;

    // Create test conversation
    const conversation = await ConversationModel.create(
      testClientId,
      'whatsapp',
      {
        lastMessages: [],
        variables: {}
      }
    );
    testConversationId = conversation.id;
  });

  afterAll(async () => {
    // Cleanup
    if (testConversationId) {
      await db('conversations').where({ id: testConversationId }).delete();
    }
    if (testClientId) {
      await db('clients').where({ id: testClientId }).delete();
    }
  });

  afterEach(async () => {
    // Reset takeover state after each test
    await ConversationModel.setHumanTakeover(testConversationId, 'test-agent', false);
  });

  test('should return false when no takeover is active', async () => {
    const result = await HumanTakeoverService.isUnderHumanControl(testConversationId);
    expect(result).toBe(false);
  });

  test('should return true when takeover is active and no timeout', async () => {
    // Set active takeover
    await ConversationModel.setHumanTakeover(testConversationId, 'test-agent', true);

    const result = await HumanTakeoverService.isUnderHumanControl(testConversationId);
    expect(result).toBe(true);
  });

  test('should return true when takeover is active with recent message', async () => {
    // Set active takeover
    await ConversationModel.setHumanTakeover(testConversationId, 'test-agent', true);
    
    // Update timestamp to now
    await ConversationModel.updateLastHumanMessageTime(testConversationId);

    const result = await HumanTakeoverService.isUnderHumanControl(testConversationId);
    expect(result).toBe(true);
  });

  test('should return false and auto-deactivate when timeout expired (> 1 hour)', async () => {
    // Set active takeover with old timestamp
    await ConversationModel.setHumanTakeover(testConversationId, 'test-agent', true);
    
    // Set timestamp to 2 hours ago
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    await db('conversations')
      .where({ id: testConversationId })
      .update({ last_human_message_time: twoHoursAgo });

    // Check if under control - should return false and auto-deactivate
    const result = await HumanTakeoverService.isUnderHumanControl(testConversationId);
    expect(result).toBe(false);

    // Verify database was updated
    const state = await ConversationModel.getHumanTakeoverState(testConversationId);
    expect(state!.active).toBe(false);
    expect(state!.agentId).toBeNull();
  });

  test('should return false on database error', async () => {
    // Test with non-existent conversation ID
    const result = await HumanTakeoverService.isUnderHumanControl('non-existent-id');
    expect(result).toBe(false);
  });

  test('should handle edge case of exactly 1 hour', async () => {
    // Set active takeover
    await ConversationModel.setHumanTakeover(testConversationId, 'test-agent', true);
    
    // Set timestamp to exactly 1 hour ago
    const exactlyOneHour = new Date(Date.now() - 60 * 60 * 1000);
    await db('conversations')
      .where({ id: testConversationId })
      .update({ last_human_message_time: exactlyOneHour });

    // Should still be under control (not > 1 hour)
    const result = await HumanTakeoverService.isUnderHumanControl(testConversationId);
    expect(result).toBe(true);
  });

  test('should handle edge case of 1 hour + 1 second', async () => {
    // Set active takeover
    await ConversationModel.setHumanTakeover(testConversationId, 'test-agent', true);
    
    // Set timestamp to 1 hour + 1 second ago
    const oneHourOneSec = new Date(Date.now() - (60 * 60 * 1000 + 1000));
    await db('conversations')
      .where({ id: testConversationId })
      .update({ last_human_message_time: oneHourOneSec });

    // Should NOT be under control (> 1 hour)
    const result = await HumanTakeoverService.isUnderHumanControl(testConversationId);
    expect(result).toBe(false);

    // Verify auto-deactivation
    const state = await ConversationModel.getHumanTakeoverState(testConversationId);
    expect(state!.active).toBe(false);
  });
});

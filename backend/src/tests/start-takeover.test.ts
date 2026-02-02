/**
 * Tests for HumanTakeoverService.startTakeover() - Database Persistence
 * 
 * This test suite verifies that startTakeover() correctly persists state to the database
 * instead of using in-memory storage.
 */

import { HumanTakeoverService } from '../services/ai/HumanTakeoverService';
import { ConversationModel } from '../models/Conversation';
import { ClientModel } from '../models/Client';
import db from '../config/database';

describe('HumanTakeoverService.startTakeover() - Database Persistence', () => {
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
      'whatsapp'
    );
    testConversationId = conversation.id;
  }, 30000);

  afterAll(async () => {
    // Cleanup
    await db('conversations').where({ id: testConversationId }).delete();
    await db('clients').where({ id: testClientId }).delete();
    await db.destroy();
  }, 30000);

  afterEach(async () => {
    // Reset takeover state after each test
    await ConversationModel.setHumanTakeover(testConversationId, 'test-agent', false);
  });

  describe('Basic functionality', () => {
    test('should persist takeover state to database when starting takeover', async () => {
      const agentId = 'agent-123';

      // Start takeover
      const result = await HumanTakeoverService.startTakeover(
        testConversationId,
        agentId
      );

      // Verify success
      expect(result.success).toBe(true);
      expect(result.sessionId).toBe(testConversationId);
      expect(result.message).toBe('Control tomado exitosamente');

      // Verify database state
      const state = await ConversationModel.getHumanTakeoverState(testConversationId);
      expect(state).not.toBeNull();
      expect(state!.active).toBe(true);
      expect(state!.agentId).toBe(agentId);
      expect(state!.lastMessageTime).not.toBeNull();
    });

    test('should return error for non-existent conversation', async () => {
      const result = await HumanTakeoverService.startTakeover(
        'non-existent-id',
        'agent-123'
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Conversación no encontrada');
    });

    test('should return success if same agent tries to take control again', async () => {
      const agentId = 'agent-same';

      // First takeover
      await HumanTakeoverService.startTakeover(testConversationId, agentId);

      // Second takeover by same agent
      const result = await HumanTakeoverService.startTakeover(
        testConversationId,
        agentId
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Ya tienes control de esta conversación');

      // Verify database still has active state
      const state = await ConversationModel.getHumanTakeoverState(testConversationId);
      expect(state!.active).toBe(true);
      expect(state!.agentId).toBe(agentId);
    });

    test('should prevent concurrent takeover by different agent', async () => {
      const agent1 = 'agent-first';
      const agent2 = 'agent-second';

      // Agent 1 takes control
      const result1 = await HumanTakeoverService.startTakeover(
        testConversationId,
        agent1
      );
      expect(result1.success).toBe(true);

      // Agent 2 tries to take control
      const result2 = await HumanTakeoverService.startTakeover(
        testConversationId,
        agent2
      );

      expect(result2.success).toBe(false);
      expect(result2.message).toContain('ya está siendo controlada');

      // Verify database still has agent1
      const state = await ConversationModel.getHumanTakeoverState(testConversationId);
      expect(state!.active).toBe(true);
      expect(state!.agentId).toBe(agent1);
    });
  });

  describe('Database state verification', () => {
    test('should query database instead of in-memory Map', async () => {
      const agentId = 'agent-db-check';

      // Start takeover
      await HumanTakeoverService.startTakeover(testConversationId, agentId);

      // Directly query database to verify state
      const dbState = await db('conversations')
        .where({ id: testConversationId })
        .select('human_takeover_active', 'human_takeover_agent_id', 'last_human_message_time')
        .first();

      expect(dbState.human_takeover_active).toBe(true);
      expect(dbState.human_takeover_agent_id).toBe(agentId);
      expect(dbState.last_human_message_time).not.toBeNull();
    });

    test('should update conversation status to escalated', async () => {
      const agentId = 'agent-status';

      // Start takeover
      await HumanTakeoverService.startTakeover(testConversationId, agentId);

      // Verify conversation status
      const conversation = await ConversationModel.findById(testConversationId);
      expect(conversation!.status).toBe('escalated');
    });

    test('should update conversation context with humanAgentId', async () => {
      const agentId = 'agent-context';

      // Start takeover
      await HumanTakeoverService.startTakeover(testConversationId, agentId);

      // Verify context
      const conversation = await ConversationModel.findById(testConversationId);
      expect(conversation!.context.humanAgentId).toBe(agentId);
    });

    test('should add system message when starting takeover', async () => {
      const agentId = 'agent-message';

      // Get initial message count
      const messagesBefore = await db('messages')
        .where({ conversation_id: testConversationId })
        .count('* as count')
        .first();

      // Start takeover
      await HumanTakeoverService.startTakeover(testConversationId, agentId);

      // Verify system message was added
      const messagesAfter = await db('messages')
        .where({ conversation_id: testConversationId })
        .count('* as count')
        .first();

      const beforeCount = Number(messagesBefore?.count || 0);
      const afterCount = Number(messagesAfter?.count || 0);
      expect(afterCount).toBeGreaterThan(beforeCount);

      // Verify message content
      const systemMessage = await db('messages')
        .where({ conversation_id: testConversationId })
        .orderBy('created_at', 'desc')
        .first();

      expect(systemMessage.sender_type).toBe('ai');
      expect(systemMessage.content).toContain('agente humano ha tomado control');
    });
  });

  describe('Backward compatibility', () => {
    test('should return session object for backward compatibility', async () => {
      const agentId = 'agent-compat';
      const escalationId = 'escalation-123';

      // Start takeover with escalation
      const result = await HumanTakeoverService.startTakeover(
        testConversationId,
        agentId,
        escalationId
      );

      expect(result.success).toBe(true);
      expect(result.session).toBeDefined();
      expect(result.session!.conversationId).toBe(testConversationId);
      expect(result.session!.humanAgentId).toBe(agentId);
      expect(result.session!.escalationId).toBe(escalationId);
      expect(result.session!.status).toBe('active');
      expect(result.session!.startTime).toBeInstanceOf(Date);
    });

    test('should include escalationReason in context when escalationId provided', async () => {
      const agentId = 'agent-escalation';
      const escalationId = 'escalation-456';

      // Start takeover with escalation
      await HumanTakeoverService.startTakeover(
        testConversationId,
        agentId,
        escalationId
      );

      // Verify context
      const conversation = await ConversationModel.findById(testConversationId);
      expect(conversation!.context.escalationReason).toBe('human_takeover');
    });
  });

  describe('Integration with isUnderHumanControl', () => {
    test('should return true after starting takeover', async () => {
      const agentId = 'agent-control';

      // Start takeover
      await HumanTakeoverService.startTakeover(testConversationId, agentId);

      // Verify control check
      const isUnderControl = await HumanTakeoverService.isUnderHumanControl(
        testConversationId
      );

      expect(isUnderControl).toBe(true);
    });

    test('should persist across service method calls', async () => {
      const agentId = 'agent-persist';

      // Start takeover
      await HumanTakeoverService.startTakeover(testConversationId, agentId);

      // Check control multiple times
      const check1 = await HumanTakeoverService.isUnderHumanControl(testConversationId);
      const check2 = await HumanTakeoverService.isUnderHumanControl(testConversationId);
      const check3 = await HumanTakeoverService.isUnderHumanControl(testConversationId);

      expect(check1).toBe(true);
      expect(check2).toBe(true);
      expect(check3).toBe(true);
    });
  });
});

import { ConversationModel } from '../models/Conversation';
import { ClientModel } from '../models/Client';
import { HumanTakeoverService } from '../services/ai/HumanTakeoverService';
import db from '../config/database';
import * as fc from 'fast-check';

describe('ConversationModel - Human Takeover Methods', () => {
  jest.setTimeout(30000); // Increase timeout for database operations
  
  let testClientId: string;
  let testConversationId: string;

  beforeAll(async () => {
    // Create a test client
    const client = await ClientModel.create({
      name: 'Test Client for Takeover',
      phone: '+1234567890',
      email: 'test-takeover@example.com'
    });
    testClientId = client.id;

    // Create a test conversation
    const conversation = await ConversationModel.create(testClientId, 'whatsapp');
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

  describe('updateLastHumanMessageTime', () => {
    test('should update last_human_message_time to current timestamp', async () => {
      // Get initial state
      const beforeUpdate = await db('conversations')
        .where({ id: testConversationId })
        .select('last_human_message_time')
        .first();

      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      // Update timestamp
      await ConversationModel.updateLastHumanMessageTime(testConversationId);

      // Get updated state
      const afterUpdate = await db('conversations')
        .where({ id: testConversationId })
        .select('last_human_message_time', 'updated_at')
        .first();

      // Verify timestamp was updated
      expect(afterUpdate.last_human_message_time).not.toBeNull();
      
      if (beforeUpdate.last_human_message_time) {
        const beforeTime = new Date(beforeUpdate.last_human_message_time).getTime();
        const afterTime = new Date(afterUpdate.last_human_message_time).getTime();
        expect(afterTime).toBeGreaterThan(beforeTime);
      }

      // Verify updated_at was also updated
      expect(afterUpdate.updated_at).not.toBeNull();
    });

    test('should update timestamp multiple times', async () => {
      // First update
      await ConversationModel.updateLastHumanMessageTime(testConversationId);
      const firstUpdate = await db('conversations')
        .where({ id: testConversationId })
        .select('last_human_message_time')
        .first();

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 100));

      // Second update
      await ConversationModel.updateLastHumanMessageTime(testConversationId);
      const secondUpdate = await db('conversations')
        .where({ id: testConversationId })
        .select('last_human_message_time')
        .first();

      // Verify second timestamp is later than first
      const firstTime = new Date(firstUpdate.last_human_message_time).getTime();
      const secondTime = new Date(secondUpdate.last_human_message_time).getTime();
      expect(secondTime).toBeGreaterThan(firstTime);
    });

    test('should handle non-existent conversation gracefully', async () => {
      // This should not throw an error, just update 0 rows
      await expect(
        ConversationModel.updateLastHumanMessageTime('non-existent-id')
      ).resolves.not.toThrow();
    });
  });

  describe('getHumanTakeoverState', () => {
    test('should return null for non-existent conversation', async () => {
      const state = await ConversationModel.getHumanTakeoverState('non-existent-id');
      expect(state).toBeNull();
    });

    test('should return inactive state for conversation without takeover', async () => {
      // Ensure conversation has no active takeover
      await db('conversations')
        .where({ id: testConversationId })
        .update({
          human_takeover_active: false,
          human_takeover_agent_id: null,
          last_human_message_time: null
        });

      const state = await ConversationModel.getHumanTakeoverState(testConversationId);
      
      expect(state).not.toBeNull();
      expect(state!.active).toBe(false);
      expect(state!.agentId).toBeNull();
      expect(state!.lastMessageTime).toBeNull();
    });

    test('should return active state with agent ID and timestamp', async () => {
      const agentId = 'agent-123';
      const timestamp = new Date();

      // Set active takeover
      await db('conversations')
        .where({ id: testConversationId })
        .update({
          human_takeover_active: true,
          human_takeover_agent_id: agentId,
          last_human_message_time: timestamp
        });

      const state = await ConversationModel.getHumanTakeoverState(testConversationId);
      
      expect(state).not.toBeNull();
      expect(state!.active).toBe(true);
      expect(state!.agentId).toBe(agentId);
      expect(state!.lastMessageTime).not.toBeNull();
      
      // Verify timestamp is close to what we set (within 1 second)
      const timeDiff = Math.abs(
        new Date(state!.lastMessageTime!).getTime() - timestamp.getTime()
      );
      expect(timeDiff).toBeLessThan(1000);
    });

    test('should return correct state after setHumanTakeover', async () => {
      const agentId = 'agent-456';

      // Activate takeover using setHumanTakeover
      await ConversationModel.setHumanTakeover(testConversationId, agentId, true);

      // Get state
      const state = await ConversationModel.getHumanTakeoverState(testConversationId);
      
      expect(state).not.toBeNull();
      expect(state!.active).toBe(true);
      expect(state!.agentId).toBe(agentId);
      expect(state!.lastMessageTime).not.toBeNull();
    });

    test('should return inactive state after deactivating takeover', async () => {
      const agentId = 'agent-789';

      // First activate
      await ConversationModel.setHumanTakeover(testConversationId, agentId, true);
      
      // Then deactivate
      await ConversationModel.setHumanTakeover(testConversationId, agentId, false);

      // Get state
      const state = await ConversationModel.getHumanTakeoverState(testConversationId);
      
      expect(state).not.toBeNull();
      expect(state!.active).toBe(false);
      expect(state!.agentId).toBeNull();
      expect(state!.lastMessageTime).toBeNull();
    });

    test('should reflect updated timestamp after updateLastHumanMessageTime', async () => {
      const agentId = 'agent-update-test';

      // Activate takeover
      await ConversationModel.setHumanTakeover(testConversationId, agentId, true);
      
      // Get initial state
      const initialState = await ConversationModel.getHumanTakeoverState(testConversationId);
      const initialTime = initialState!.lastMessageTime!.getTime();

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 100));

      // Update timestamp
      await ConversationModel.updateLastHumanMessageTime(testConversationId);

      // Get updated state
      const updatedState = await ConversationModel.getHumanTakeoverState(testConversationId);
      const updatedTime = updatedState!.lastMessageTime!.getTime();

      // Verify timestamp was updated
      expect(updatedTime).toBeGreaterThan(initialTime);
      expect(updatedState!.active).toBe(true);
      expect(updatedState!.agentId).toBe(agentId);
    });

    test('should handle different agent IDs correctly', async () => {
      const agent1 = 'agent-001';
      const agent2 = 'agent-002';

      // Set first agent
      await ConversationModel.setHumanTakeover(testConversationId, agent1, true);
      let state = await ConversationModel.getHumanTakeoverState(testConversationId);
      expect(state!.agentId).toBe(agent1);

      // Deactivate
      await ConversationModel.setHumanTakeover(testConversationId, agent1, false);

      // Set second agent
      await ConversationModel.setHumanTakeover(testConversationId, agent2, true);
      state = await ConversationModel.getHumanTakeoverState(testConversationId);
      expect(state!.agentId).toBe(agent2);
    });
  });

  describe('clearExpiredTakeovers', () => {
    test('should clear takeover sessions older than 1 hour', async () => {
      // Create multiple test conversations with different timestamps
      const client = await ClientModel.create({
        name: 'Test Client for Expired Takeover',
        phone: '+1234567891',
        email: 'test-expired@example.com'
      });

      const conv1 = await ConversationModel.create(client.id, 'whatsapp');
      const conv2 = await ConversationModel.create(client.id, 'whatsapp');
      const conv3 = await ConversationModel.create(client.id, 'whatsapp');

      try {
        // Set conv1 with timestamp 2 hours ago (should be cleared)
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        await db('conversations')
          .where({ id: conv1.id })
          .update({
            human_takeover_active: true,
            human_takeover_agent_id: 'agent-expired-1',
            last_human_message_time: twoHoursAgo
          });

        // Set conv2 with timestamp 30 minutes ago (should NOT be cleared)
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        await db('conversations')
          .where({ id: conv2.id })
          .update({
            human_takeover_active: true,
            human_takeover_agent_id: 'agent-active',
            last_human_message_time: thirtyMinutesAgo
          });

        // Set conv3 with timestamp 90 minutes ago (should be cleared)
        const ninetyMinutesAgo = new Date(Date.now() - 90 * 60 * 1000);
        await db('conversations')
          .where({ id: conv3.id })
          .update({
            human_takeover_active: true,
            human_takeover_agent_id: 'agent-expired-2',
            last_human_message_time: ninetyMinutesAgo
          });

        // Clear expired takeovers
        const clearedCount = await ConversationModel.clearExpiredTakeovers();

        // Should have cleared 2 conversations
        expect(clearedCount).toBe(2);

        // Verify conv1 was cleared
        const state1 = await ConversationModel.getHumanTakeoverState(conv1.id);
        expect(state1!.active).toBe(false);
        expect(state1!.agentId).toBeNull();

        // Verify conv2 is still active
        const state2 = await ConversationModel.getHumanTakeoverState(conv2.id);
        expect(state2!.active).toBe(true);
        expect(state2!.agentId).toBe('agent-active');

        // Verify conv3 was cleared
        const state3 = await ConversationModel.getHumanTakeoverState(conv3.id);
        expect(state3!.active).toBe(false);
        expect(state3!.agentId).toBeNull();
      } finally {
        // Cleanup
        await db('conversations').whereIn('id', [conv1.id, conv2.id, conv3.id]).delete();
        await db('clients').where({ id: client.id }).delete();
      }
    });

    test('should return 0 when no expired takeovers exist', async () => {
      // Create a conversation with recent takeover
      const client = await ClientModel.create({
        name: 'Test Client No Expired',
        phone: '+1234567892',
        email: 'test-no-expired@example.com'
      });

      const conv = await ConversationModel.create(client.id, 'whatsapp');

      try {
        // Set active takeover with recent timestamp
        await ConversationModel.setHumanTakeover(conv.id, 'agent-recent', true);

        // Clear expired takeovers
        const clearedCount = await ConversationModel.clearExpiredTakeovers();

        // Should have cleared 0 conversations
        expect(clearedCount).toBe(0);

        // Verify conversation is still active
        const state = await ConversationModel.getHumanTakeoverState(conv.id);
        expect(state!.active).toBe(true);
        expect(state!.agentId).toBe('agent-recent');
      } finally {
        // Cleanup
        await db('conversations').where({ id: conv.id }).delete();
        await db('clients').where({ id: client.id }).delete();
      }
    });

    test('should not affect inactive takeover sessions', async () => {
      // Create a conversation with inactive takeover
      const client = await ClientModel.create({
        name: 'Test Client Inactive',
        phone: '+1234567893',
        email: 'test-inactive@example.com'
      });

      const conv = await ConversationModel.create(client.id, 'whatsapp');

      try {
        // Set inactive takeover with old timestamp
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        await db('conversations')
          .where({ id: conv.id })
          .update({
            human_takeover_active: false,
            human_takeover_agent_id: null,
            last_human_message_time: twoHoursAgo
          });

        // Clear expired takeovers
        const clearedCount = await ConversationModel.clearExpiredTakeovers();

        // Should not count inactive sessions
        expect(clearedCount).toBe(0);

        // Verify conversation is still inactive
        const state = await ConversationModel.getHumanTakeoverState(conv.id);
        expect(state!.active).toBe(false);
      } finally {
        // Cleanup
        await db('conversations').where({ id: conv.id }).delete();
        await db('clients').where({ id: client.id }).delete();
      }
    });

    test('should handle edge case of exactly 1 hour', async () => {
      // Create a conversation with timestamp exactly 1 hour ago
      const client = await ClientModel.create({
        name: 'Test Client Edge Case',
        phone: '+1234567894',
        email: 'test-edge@example.com'
      });

      const conv = await ConversationModel.create(client.id, 'whatsapp');

      try {
        // Set timestamp to exactly 1 hour ago (60 minutes)
        const exactlyOneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        await db('conversations')
          .where({ id: conv.id })
          .update({
            human_takeover_active: true,
            human_takeover_agent_id: 'agent-edge',
            last_human_message_time: exactlyOneHourAgo
          });

        // Wait a moment to ensure we're past the 1 hour mark
        await new Promise(resolve => setTimeout(resolve, 100));

        // Clear expired takeovers
        const clearedCount = await ConversationModel.clearExpiredTakeovers();

        // Should have cleared the conversation (> 1 hour)
        expect(clearedCount).toBeGreaterThanOrEqual(1);

        // Verify conversation was cleared
        const state = await ConversationModel.getHumanTakeoverState(conv.id);
        expect(state!.active).toBe(false);
      } finally {
        // Cleanup
        await db('conversations').where({ id: conv.id }).delete();
        await db('clients').where({ id: client.id }).delete();
      }
    });

    test('should update updated_at timestamp when clearing', async () => {
      // Create a conversation with expired takeover
      const client = await ClientModel.create({
        name: 'Test Client Updated At',
        phone: '+1234567895',
        email: 'test-updated-at@example.com'
      });

      const conv = await ConversationModel.create(client.id, 'whatsapp');

      try {
        // Set expired takeover
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        await db('conversations')
          .where({ id: conv.id })
          .update({
            human_takeover_active: true,
            human_takeover_agent_id: 'agent-timestamp',
            last_human_message_time: twoHoursAgo,
            updated_at: twoHoursAgo
          });

        // Get initial updated_at
        const beforeClear = await db('conversations')
          .where({ id: conv.id })
          .select('updated_at')
          .first();

        // Clear expired takeovers
        await ConversationModel.clearExpiredTakeovers();

        // Get updated updated_at
        const afterClear = await db('conversations')
          .where({ id: conv.id })
          .select('updated_at')
          .first();

        // Verify updated_at was updated
        const beforeTime = new Date(beforeClear.updated_at).getTime();
        const afterTime = new Date(afterClear.updated_at).getTime();
        expect(afterTime).toBeGreaterThan(beforeTime);
      } finally {
        // Cleanup
        await db('conversations').where({ id: conv.id }).delete();
        await db('clients').where({ id: client.id }).delete();
      }
    });

    test('should handle multiple calls without errors', async () => {
      // First call
      const count1 = await ConversationModel.clearExpiredTakeovers();
      expect(count1).toBeGreaterThanOrEqual(0);

      // Second call immediately after
      const count2 = await ConversationModel.clearExpiredTakeovers();
      expect(count2).toBeGreaterThanOrEqual(0);

      // Both calls should succeed without errors
    });

    test('should clear multiple expired sessions in one call', async () => {
      // Create multiple conversations with expired takeovers
      const client = await ClientModel.create({
        name: 'Test Client Multiple',
        phone: '+1234567896',
        email: 'test-multiple@example.com'
      });

      const conversations = [];
      for (let i = 0; i < 5; i++) {
        const conv = await ConversationModel.create(client.id, 'whatsapp');
        conversations.push(conv);

        // Set expired takeover
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        await db('conversations')
          .where({ id: conv.id })
          .update({
            human_takeover_active: true,
            human_takeover_agent_id: `agent-${i}`,
            last_human_message_time: twoHoursAgo
          });
      }

      try {
        // Clear all expired takeovers
        const clearedCount = await ConversationModel.clearExpiredTakeovers();

        // Should have cleared all 5 conversations
        expect(clearedCount).toBeGreaterThanOrEqual(5);

        // Verify all conversations were cleared
        for (const conv of conversations) {
          const state = await ConversationModel.getHumanTakeoverState(conv.id);
          expect(state!.active).toBe(false);
          expect(state!.agentId).toBeNull();
        }
      } finally {
        // Cleanup
        const convIds = conversations.map(c => c.id);
        await db('conversations').whereIn('id', convIds).delete();
        await db('clients').where({ id: client.id }).delete();
      }
    });
  });

  // Property-Based Tests
  describe('Property 1: Takeover State Persistence', () => {
    /**
     * **Validates: Requirements 1.1, 1.4**
     * 
     * Property: For any conversation ID and agent ID, when setHumanTakeover() is called 
     * with active=true, querying the database should return a takeover state with 
     * active=true, the correct agentId, and a non-null lastMessageTime.
     */
    test('Property 1: Starting takeover persists state to database correctly across all valid inputs', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)), // agentId
          async (agentId) => {
            // Setup: Create a test conversation
            const client = await ClientModel.create({
              name: `Test Client PBT ${agentId}`,
              phone: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
              email: `test-pbt-${agentId}@example.com`
            });

            const conversation = await ConversationModel.create(client.id, 'whatsapp');
            const conversationId = conversation.id;

            try {
              // Action: Start takeover using setHumanTakeover
              await ConversationModel.setHumanTakeover(conversationId, agentId, true);

              // Verify: Database has correct state
              const state = await ConversationModel.getHumanTakeoverState(conversationId);
              
              // Assertions
              expect(state).not.toBeNull();
              expect(state!.active).toBe(true);
              expect(state!.agentId).toBe(agentId);
              expect(state!.lastMessageTime).not.toBeNull();
              
              // Verify timestamp is recent (within last 5 seconds)
              const now = Date.now();
              const messageTime = new Date(state!.lastMessageTime!).getTime();
              const timeDiff = now - messageTime;
              expect(timeDiff).toBeGreaterThanOrEqual(0);
              expect(timeDiff).toBeLessThan(5000); // Within 5 seconds

            } finally {
              // Cleanup
              await db('conversations').where({ id: conversationId }).delete();
              await db('clients').where({ id: client.id }).delete();
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations with different agent IDs
      );
    });

    /**
     * Property: For any conversation ID and agent ID, when setHumanTakeover() is called 
     * with active=false, querying the database should return a takeover state with 
     * active=false, null agentId, and null lastMessageTime.
     */
    test('Property 1b: Ending takeover clears state in database correctly across all valid inputs', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)), // agentId
          async (agentId) => {
            // Setup: Create a test conversation with active takeover
            const client = await ClientModel.create({
              name: `Test Client PBT End ${agentId}`,
              phone: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
              email: `test-pbt-end-${agentId}@example.com`
            });

            const conversation = await ConversationModel.create(client.id, 'whatsapp');
            const conversationId = conversation.id;

            try {
              // First activate takeover
              await ConversationModel.setHumanTakeover(conversationId, agentId, true);
              
              // Verify it's active
              let state = await ConversationModel.getHumanTakeoverState(conversationId);
              expect(state!.active).toBe(true);

              // Action: End takeover using setHumanTakeover
              await ConversationModel.setHumanTakeover(conversationId, agentId, false);

              // Verify: Database has cleared state
              state = await ConversationModel.getHumanTakeoverState(conversationId);
              
              // Assertions
              expect(state).not.toBeNull();
              expect(state!.active).toBe(false);
              expect(state!.agentId).toBeNull();
              expect(state!.lastMessageTime).toBeNull();

            } finally {
              // Cleanup
              await db('conversations').where({ id: conversationId }).delete();
              await db('clients').where({ id: client.id }).delete();
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations with different agent IDs
      );
    });

    /**
     * Property: For any two different agent IDs, setHumanTakeover should correctly 
     * update the agent ID in the database when switching between agents.
     */
    test('Property 1c: Switching agents updates state correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)), // agent1
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)), // agent2
          async (agent1, agent2) => {
            // Skip if agents are the same
            fc.pre(agent1 !== agent2);

            // Setup: Create a test conversation
            const client = await ClientModel.create({
              name: `Test Client PBT Switch ${agent1}`,
              phone: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
              email: `test-pbt-switch-${agent1}@example.com`
            });

            const conversation = await ConversationModel.create(client.id, 'whatsapp');
            const conversationId = conversation.id;

            try {
              // Action 1: Set first agent
              await ConversationModel.setHumanTakeover(conversationId, agent1, true);
              let state = await ConversationModel.getHumanTakeoverState(conversationId);
              expect(state!.active).toBe(true);
              expect(state!.agentId).toBe(agent1);

              // Action 2: Deactivate
              await ConversationModel.setHumanTakeover(conversationId, agent1, false);
              state = await ConversationModel.getHumanTakeoverState(conversationId);
              expect(state!.active).toBe(false);
              expect(state!.agentId).toBeNull();

              // Action 3: Set second agent
              await ConversationModel.setHumanTakeover(conversationId, agent2, true);
              state = await ConversationModel.getHumanTakeoverState(conversationId);
              expect(state!.active).toBe(true);
              expect(state!.agentId).toBe(agent2);

            } finally {
              // Cleanup
              await db('conversations').where({ id: conversationId }).delete();
              await db('clients').where({ id: client.id }).delete();
            }
          }
        ),
        { numRuns: 50 } // Run 50 iterations (fewer because we have 2 agents per test)
      );
    });
  });

  // Property-Based Tests for HumanTakeoverService
  describe('Property 2: Database-Backed Control Check', () => {
    /**
     * **Validates: Requirements 1.3**
     * 
     * Property: For any conversation with takeover state in the database, 
     * isUnderHumanControl() should return the same result as the database state 
     * (accounting for timeout logic), without relying on in-memory storage.
     */
    test('Property 2: isUnderHumanControl() correctly reflects database state for active takeovers', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)), // agentId
          fc.integer({ min: 0, max: 59 }), // minutes since last message (< 1 hour)
          async (agentId, minutesSinceLastMessage) => {
            // Setup: Create a test conversation with active takeover
            const client = await ClientModel.create({
              name: `Test Client PBT P2 ${agentId}`,
              phone: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
              email: `test-pbt-p2-${agentId}@example.com`
            });

            const conversation = await ConversationModel.create(client.id, 'whatsapp');
            const conversationId = conversation.id;

            try {
              // Set active takeover with timestamp within 1 hour
              const timestamp = new Date(Date.now() - minutesSinceLastMessage * 60 * 1000);
              await db('conversations')
                .where({ id: conversationId })
                .update({
                  human_takeover_active: true,
                  human_takeover_agent_id: agentId,
                  last_human_message_time: timestamp
                });

              // Action: Check if under human control
              const isUnderControl = await HumanTakeoverService.isUnderHumanControl(conversationId);

              // Verify: Should return true (within 1 hour)
              expect(isUnderControl).toBe(true);

              // Verify database state hasn't changed
              const state = await ConversationModel.getHumanTakeoverState(conversationId);
              expect(state!.active).toBe(true);
              expect(state!.agentId).toBe(agentId);

            } finally {
              // Cleanup
              await db('conversations').where({ id: conversationId }).delete();
              await db('clients').where({ id: client.id }).delete();
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations
      );
    });

    /**
     * Property: For any conversation with expired takeover state (> 1 hour), 
     * isUnderHumanControl() should return false and auto-deactivate the takeover.
     */
    test('Property 2b: isUnderHumanControl() auto-deactivates expired takeovers', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)), // agentId
          fc.integer({ min: 61, max: 180 }), // minutes since last message (> 1 hour)
          async (agentId, minutesSinceLastMessage) => {
            // Setup: Create a test conversation with expired takeover
            const client = await ClientModel.create({
              name: `Test Client PBT P2b ${agentId}`,
              phone: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
              email: `test-pbt-p2b-${agentId}@example.com`
            });

            const conversation = await ConversationModel.create(client.id, 'whatsapp');
            const conversationId = conversation.id;

            try {
              // Set active takeover with old timestamp (> 1 hour)
              const oldTimestamp = new Date(Date.now() - minutesSinceLastMessage * 60 * 1000);
              await db('conversations')
                .where({ id: conversationId })
                .update({
                  human_takeover_active: true,
                  human_takeover_agent_id: agentId,
                  last_human_message_time: oldTimestamp
                });

              // Action: Check if under human control
              const isUnderControl = await HumanTakeoverService.isUnderHumanControl(conversationId);

              // Verify: Should return false (expired)
              expect(isUnderControl).toBe(false);

              // Verify database was auto-deactivated
              const state = await ConversationModel.getHumanTakeoverState(conversationId);
              expect(state!.active).toBe(false);
              expect(state!.agentId).toBeNull();

            } finally {
              // Cleanup
              await db('conversations').where({ id: conversationId }).delete();
              await db('clients').where({ id: client.id }).delete();
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations
      );
    });

    /**
     * Property: For any conversation without takeover state, 
     * isUnderHumanControl() should return false.
     */
    test('Property 2c: isUnderHumanControl() returns false for conversations without takeover', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(null), // No specific input needed
          async () => {
            // Setup: Create a test conversation without takeover
            const client = await ClientModel.create({
              name: `Test Client PBT P2c`,
              phone: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
              email: `test-pbt-p2c-${Math.random()}@example.com`
            });

            const conversation = await ConversationModel.create(client.id, 'whatsapp');
            const conversationId = conversation.id;

            try {
              // Ensure no takeover state
              await db('conversations')
                .where({ id: conversationId })
                .update({
                  human_takeover_active: false,
                  human_takeover_agent_id: null,
                  last_human_message_time: null
                });

              // Action: Check if under human control
              const isUnderControl = await HumanTakeoverService.isUnderHumanControl(conversationId);

              // Verify: Should return false
              expect(isUnderControl).toBe(false);

            } finally {
              // Cleanup
              await db('conversations').where({ id: conversationId }).delete();
              await db('clients').where({ id: client.id }).delete();
            }
          }
        ),
        { numRuns: 50 } // Run 50 iterations (simpler test)
      );
    });

    /**
     * Property: For any conversation with takeover but no timestamp, 
     * isUnderHumanControl() should return true (considered under control).
     */
    test('Property 2d: isUnderHumanControl() returns true for takeover without timestamp', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)), // agentId
          async (agentId) => {
            // Setup: Create a test conversation with takeover but no timestamp
            const client = await ClientModel.create({
              name: `Test Client PBT P2d ${agentId}`,
              phone: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
              email: `test-pbt-p2d-${agentId}@example.com`
            });

            const conversation = await ConversationModel.create(client.id, 'whatsapp');
            const conversationId = conversation.id;

            try {
              // Set active takeover without timestamp
              await db('conversations')
                .where({ id: conversationId })
                .update({
                  human_takeover_active: true,
                  human_takeover_agent_id: agentId,
                  last_human_message_time: null
                });

              // Action: Check if under human control
              const isUnderControl = await HumanTakeoverService.isUnderHumanControl(conversationId);

              // Verify: Should return true (no timeout check without timestamp)
              expect(isUnderControl).toBe(true);

              // Verify database state hasn't changed
              const state = await ConversationModel.getHumanTakeoverState(conversationId);
              expect(state!.active).toBe(true);
              expect(state!.agentId).toBe(agentId);

            } finally {
              // Cleanup
              await db('conversations').where({ id: conversationId }).delete();
              await db('clients').where({ id: client.id }).delete();
            }
          }
        ),
        { numRuns: 50 } // Run 50 iterations
      );
    });

    /**
     * Property: For any non-existent conversation ID, 
     * isUnderHumanControl() should return false without throwing errors.
     */
    test('Property 2e: isUnderHumanControl() handles non-existent conversations gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // Random conversation ID
          async (conversationId) => {
            // Action: Check if under human control for non-existent conversation
            const isUnderControl = await HumanTakeoverService.isUnderHumanControl(conversationId);

            // Verify: Should return false (default behavior on error/not found)
            expect(isUnderControl).toBe(false);
          }
        ),
        { numRuns: 50 } // Run 50 iterations
      );
    });

    /**
     * Property: For any conversation, calling isUnderHumanControl() multiple times 
     * should return consistent results (idempotent) unless timeout expires between calls.
     */
    test('Property 2f: isUnderHumanControl() is idempotent for active takeovers', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)), // agentId
          async (agentId) => {
            // Setup: Create a test conversation with active takeover
            const client = await ClientModel.create({
              name: `Test Client PBT P2f ${agentId}`,
              phone: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
              email: `test-pbt-p2f-${agentId}@example.com`
            });

            const conversation = await ConversationModel.create(client.id, 'whatsapp');
            const conversationId = conversation.id;

            try {
              // Set active takeover with recent timestamp
              await ConversationModel.setHumanTakeover(conversationId, agentId, true);

              // Action: Check multiple times
              const result1 = await HumanTakeoverService.isUnderHumanControl(conversationId);
              const result2 = await HumanTakeoverService.isUnderHumanControl(conversationId);
              const result3 = await HumanTakeoverService.isUnderHumanControl(conversationId);

              // Verify: All results should be the same
              expect(result1).toBe(true);
              expect(result2).toBe(true);
              expect(result3).toBe(true);

              // Verify database state is still active
              const state = await ConversationModel.getHumanTakeoverState(conversationId);
              expect(state!.active).toBe(true);
              expect(state!.agentId).toBe(agentId);

            } finally {
              // Cleanup
              await db('conversations').where({ id: conversationId }).delete();
              await db('clients').where({ id: client.id }).delete();
            }
          }
        ),
        { numRuns: 50 } // Run 50 iterations
      );
    });
  });
});


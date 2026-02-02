# Design Document: Persist Human Takeover State

## Overview

This design addresses the issue where the AI toggle switch in the dashboard doesn't persist across server restarts. Currently, `HumanTakeoverService` stores active sessions in an in-memory Map, which is lost when the server restarts. This design proposes adding database columns to the `conversations` table to persist the human takeover state, ensuring the AI remains disabled across restarts when a human has taken control.

The solution maintains backward compatibility with existing endpoints and preserves the 1-hour timeout feature where AI automatically reactivates if no human messages are sent within that timeframe.

## Architecture

### Current Architecture

```
┌─────────────┐
│  Dashboard  │
└──────┬──────┘
       │ HTTP
       ▼
┌─────────────────────────┐
│ HumanTakeoverService    │
│ - activeSessions: Map   │ ◄── In-memory (lost on restart)
│ - isUnderHumanControl() │
└─────────────────────────┘
```

### Proposed Architecture

```
┌─────────────┐
│  Dashboard  │
└──────┬──────┘
       │ HTTP
       ▼
┌─────────────────────────────┐
│ HumanTakeoverService        │
│ - isUnderHumanControl()     │
│ - startTakeover()           │
│ - endTakeover()             │
└──────┬──────────────────────┘
       │ Query/Update
       ▼
┌─────────────────────────────┐
│ conversations table         │
│ + human_takeover_active     │
│ + human_takeover_agent_id   │
│ + last_human_message_time   │
└─────────────────────────────┘
```

## Components and Interfaces

### Database Schema Changes

Add three new columns to the `conversations` table:

```sql
ALTER TABLE conversations
ADD COLUMN human_takeover_active BOOLEAN DEFAULT FALSE,
ADD COLUMN human_takeover_agent_id VARCHAR(255) DEFAULT NULL,
ADD COLUMN last_human_message_time TIMESTAMP NULL DEFAULT NULL,
ADD INDEX idx_human_takeover_active (human_takeover_active);
```

**Column Descriptions:**
- `human_takeover_active`: Boolean flag indicating if a conversation is currently under human control
- `human_takeover_agent_id`: ID of the human agent controlling the conversation (for audit trail)
- `last_human_message_time`: Timestamp of the last message sent by the human agent (for 1-hour timeout)

### ConversationModel Interface Updates

Add new methods to `ConversationModel`:

```typescript
class ConversationModel {
  // New methods for human takeover state
  static async setHumanTakeover(
    conversationId: string,
    agentId: string,
    active: boolean
  ): Promise<void>;

  static async updateLastHumanMessageTime(
    conversationId: string
  ): Promise<void>;

  static async getHumanTakeoverState(
    conversationId: string
  ): Promise<{
    active: boolean;
    agentId: string | null;
    lastMessageTime: Date | null;
  } | null>;

  static async clearExpiredTakeovers(): Promise<number>;
}
```

### HumanTakeoverService Interface Updates

Update existing methods to use database instead of in-memory Map:

```typescript
class HumanTakeoverService {
  // Remove: private static activeSessions = new Map<string, HumanTakeoverSession>();
  
  // Updated methods (signatures remain the same for backward compatibility)
  static async startTakeover(
    conversationId: string,
    humanAgentId: string,
    escalationId?: string
  ): Promise<{
    success: boolean;
    sessionId?: string;
    message: string;
    session?: HumanTakeoverSession;
  }>;

  static async endTakeover(
    conversationId: string,
    humanAgentId: string,
    resolution?: string
  ): Promise<{
    success: boolean;
    message: string;
  }>;

  static async sendHumanMessage(
    conversationId: string,
    humanAgentId: string,
    content: string,
    mediaUrl?: string
  ): Promise<{
    success: boolean;
    message: string;
    messageId?: string;
  }>;

  // Updated to query database
  static async isUnderHumanControl(conversationId: string): Promise<boolean>;

  // New method for cleanup
  static async cleanupExpiredSessions(): Promise<number>;
}
```

## Data Models

### Conversation Table Schema (Updated)

```typescript
interface Conversation {
  id: string;
  clientId: string;
  channel: 'web' | 'whatsapp';
  status: 'active' | 'escalated' | 'closed';
  context: ConversationContext;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // New fields
  humanTakeoverActive: boolean;
  humanTakeoverAgentId: string | null;
  lastHumanMessageTime: Date | null;
}
```

### HumanTakeoverSession Interface (Unchanged)

The `HumanTakeoverSession` interface remains the same for backward compatibility, but will be constructed from database data instead of stored in memory:

```typescript
interface HumanTakeoverSession {
  conversationId: string;
  humanAgentId: string;
  escalationId?: string;
  startTime: Date;
  lastHumanMessageTime?: Date;
  status: 'active' | 'paused' | 'ended';
  clientId: string;
  channel: 'web' | 'whatsapp';
  context: ConversationContext;
}
```

## Implementation Details

### Database Migration

Migration file: `038_add_human_takeover_to_conversations.sql`

This is a **simple change** (adding columns to existing table), so it can be created directly without discussion.

### ConversationModel Implementation

**setHumanTakeover()**:
```typescript
static async setHumanTakeover(
  conversationId: string,
  agentId: string,
  active: boolean
): Promise<void> {
  await db('conversations')
    .where({ id: conversationId })
    .update({
      human_takeover_active: active,
      human_takeover_agent_id: active ? agentId : null,
      last_human_message_time: active ? new Date() : null,
      updated_at: new Date()
    });
}
```

**updateLastHumanMessageTime()**:
```typescript
static async updateLastHumanMessageTime(
  conversationId: string
): Promise<void> {
  await db('conversations')
    .where({ id: conversationId })
    .update({
      last_human_message_time: new Date(),
      updated_at: new Date()
    });
}
```

**getHumanTakeoverState()**:
```typescript
static async getHumanTakeoverState(
  conversationId: string
): Promise<{
  active: boolean;
  agentId: string | null;
  lastMessageTime: Date | null;
} | null> {
  const conversation = await db('conversations')
    .where({ id: conversationId })
    .select(
      'human_takeover_active',
      'human_takeover_agent_id',
      'last_human_message_time'
    )
    .first();

  if (!conversation) return null;

  return {
    active: conversation.human_takeover_active,
    agentId: conversation.human_takeover_agent_id,
    lastMessageTime: conversation.last_human_message_time
  };
}
```

**clearExpiredTakeovers()**:
```typescript
static async clearExpiredTakeovers(): Promise<number> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const result = await db('conversations')
    .where('human_takeover_active', true)
    .where('last_human_message_time', '<', oneHourAgo)
    .update({
      human_takeover_active: false,
      human_takeover_agent_id: null,
      updated_at: new Date()
    });

  return result;
}
```

### HumanTakeoverService Implementation

**isUnderHumanControl()** - Updated to query database:
```typescript
static async isUnderHumanControl(conversationId: string): Promise<boolean> {
  const state = await ConversationModel.getHumanTakeoverState(conversationId);
  
  if (!state || !state.active) {
    return false;
  }

  // If no last message time, consider it under control
  if (!state.lastMessageTime) {
    return true;
  }

  // Check if more than 1 hour has passed
  const ONE_HOUR_MS = 60 * 60 * 1000;
  const timeSinceLastMessage = Date.now() - state.lastMessageTime.getTime();

  if (timeSinceLastMessage > ONE_HOUR_MS) {
    logger.info(`🤖 Bot reactivated: 1 hour passed since last human message`, {
      conversationId,
      timeSinceLastMessage: Math.round(timeSinceLastMessage / 1000 / 60) + ' minutes',
      lastHumanMessageTime: state.lastMessageTime
    });
    
    // Auto-deactivate takeover
    await ConversationModel.setHumanTakeover(conversationId, state.agentId!, false);
    return false;
  }

  return true;
}
```

**startTakeover()** - Updated to persist to database:
```typescript
static async startTakeover(
  conversationId: string,
  humanAgentId: string,
  escalationId?: string
): Promise<{
  success: boolean;
  sessionId?: string;
  message: string;
  session?: HumanTakeoverSession;
}> {
  try {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      return {
        success: false,
        message: 'Conversación no encontrada'
      };
    }

    // Check if already under human control
    const existingState = await ConversationModel.getHumanTakeoverState(conversationId);
    if (existingState?.active) {
      if (existingState.agentId === humanAgentId) {
        return {
          success: true,
          sessionId: conversationId,
          message: 'Ya tienes control de esta conversación'
        };
      } else {
        return {
          success: false,
          message: `La conversación ya está siendo controlada por otro agente`
        };
      }
    }

    // Persist to database
    await ConversationModel.setHumanTakeover(conversationId, humanAgentId, true);

    // Update conversation context and status
    const updatedContext: ConversationContext = {
      ...conversation.context,
      humanAgentId,
      escalationReason: escalationId ? 'human_takeover' : conversation.context.escalationReason
    };

    await ConversationModel.updateContext(conversationId, updatedContext);
    await ConversationModel.updateStatus(conversationId, 'escalated');

    // Add system message
    await ConversationModel.addMessage(conversationId, {
      senderType: 'ai',
      content: `Un agente humano ha tomado control de la conversación. Te atenderá personalmente.`,
      metadata: {
        systemMessage: true,
        humanAgentId,
        takeoverTime: new Date().toISOString()
      }
    });

    logger.info(`Human takeover started: ${conversationId} by ${humanAgentId}`, {
      escalationId,
      clientId: conversation.clientId,
      channel: conversation.channel
    });

    return {
      success: true,
      sessionId: conversationId,
      message: 'Control tomado exitosamente'
    };

  } catch (error) {
    logger.error('Error starting human takeover:', error);
    return {
      success: false,
      message: 'Error al tomar control de la conversación'
    };
  }
}
```

**sendHumanMessage()** - Updated to update database timestamp:
```typescript
// In sendHumanMessage(), after successfully sending the message:
// Update timestamp in database
await ConversationModel.updateLastHumanMessageTime(conversationId);

logger.info(`Human message sent: ${conversationId}`, {
  humanAgentId,
  messageLength: content.length,
  hasMedia: !!mediaUrl,
  channel: conversation.channel
});
```

**endTakeover()** - Updated to clear database state:
```typescript
static async endTakeover(
  conversationId: string,
  humanAgentId: string,
  resolution?: string
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const state = await ConversationModel.getHumanTakeoverState(conversationId);
    
    if (!state || !state.active || state.agentId !== humanAgentId) {
      return {
        success: false,
        message: 'No tienes control de esta conversación'
      };
    }

    // Clear takeover state in database
    await ConversationModel.setHumanTakeover(conversationId, humanAgentId, false);

    // Update conversation context and status
    const conversation = await ConversationModel.findById(conversationId);
    if (conversation) {
      const updatedContext: ConversationContext = {
        ...conversation.context,
        humanAgentId: undefined,
        escalationReason: undefined
      };

      await ConversationModel.updateContext(conversationId, updatedContext);
      await ConversationModel.updateStatus(conversationId, 'active');
    }

    // Resolve escalation if exists
    // ... (existing escalation resolution code)

    // Add system message
    await ConversationModel.addMessage(conversationId, {
      senderType: 'ai',
      content: `La conversación ha sido devuelta al asistente automático. ¿En qué más puedo ayudarte?`,
      metadata: {
        systemMessage: true,
        endedBy: humanAgentId,
        endTime: new Date().toISOString(),
        resolution
      }
    });

    logger.info(`Human takeover ended: ${conversationId} by ${humanAgentId}`, {
      resolution: resolution?.substring(0, 100)
    });

    return {
      success: true,
      message: 'Control finalizado exitosamente'
    };

  } catch (error) {
    logger.error('Error ending human takeover:', error);
    return {
      success: false,
      message: 'Error al finalizar control'
    };
  }
}
```

### Cleanup Job

Add a periodic cleanup job to automatically deactivate expired takeover sessions:

```typescript
// In server initialization or scheduler
setInterval(async () => {
  try {
    const cleared = await ConversationModel.clearExpiredTakeovers();
    if (cleared > 0) {
      logger.info(`Auto-cleared ${cleared} expired human takeover sessions`);
    }
  } catch (error) {
    logger.error('Error clearing expired takeover sessions:', error);
  }
}, 5 * 60 * 1000); // Run every 5 minutes
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Takeover State Persistence

*For any* conversation ID and agent ID, when `startTakeover()` is called successfully, querying the database should return a takeover state with `active=true`, the correct `agentId`, and a non-null `lastMessageTime`.

**Validates: Requirements 1.1, 1.4**

### Property 2: Database-Backed Control Check

*For any* conversation with takeover state in the database, `isUnderHumanControl()` should return the same result as the database state (accounting for timeout logic), without relying on in-memory storage.

**Validates: Requirements 1.3**

### Property 3: Timestamp Update on Human Message

*For any* active takeover session, when `sendHumanMessage()` is called successfully, the `last_human_message_time` in the database should be updated to a timestamp within the last few seconds.

**Validates: Requirements 2.1**

### Property 4: Timeout Auto-Deactivation

*For any* conversation with a takeover state where `last_human_message_time` is more than 1 hour old, calling `isUnderHumanControl()` should return `false` and update the database to set `human_takeover_active=false`.

**Validates: Requirements 2.2, 2.3, 2.4**

### Property 5: Endpoint Database Persistence

*For any* conversation, when the `/takeover/:conversationId/start` endpoint is called successfully, the database should reflect the active takeover state; and when `/takeover/:conversationId/end` is called successfully, the database should reflect the inactive state.

**Validates: Requirements 3.3, 3.4**

### Property 6: Efficient Cleanup

*For any* set of conversations with expired takeover sessions (last message > 1 hour ago), calling `clearExpiredTakeovers()` should deactivate all expired sessions and return the correct count.

**Validates: Requirements 5.4**


## Error Handling

### Database Connection Errors

**Scenario**: Database is unavailable when checking takeover state

**Handling**:
- `isUnderHumanControl()` should catch database errors and log them
- Default to `false` (allow AI to respond) to prevent conversation blocking
- Alert monitoring system of database issues

```typescript
static async isUnderHumanControl(conversationId: string): Promise<boolean> {
  try {
    const state = await ConversationModel.getHumanTakeoverState(conversationId);
    // ... rest of logic
  } catch (error) {
    logger.error('Database error checking human takeover state:', error);
    // Default to false to allow AI responses
    return false;
  }
}
```

### Migration Errors

**Scenario**: Migration fails to add columns

**Handling**:
- Migration should be idempotent (use `IF NOT EXISTS` or check for column existence)
- If migration fails, server should log error but continue running with existing schema
- Existing functionality should continue to work (in-memory fallback not needed since we're removing it)

### Concurrent Takeover Attempts

**Scenario**: Two agents try to take control simultaneously

**Handling**:
- Use database transaction or check-then-update pattern
- First agent to update database wins
- Second agent receives error message: "La conversación ya está siendo controlada por otro agente"

### Timeout Edge Cases

**Scenario**: Timeout occurs exactly at 1 hour

**Handling**:
- Use `>` comparison (strictly greater than 1 hour) to avoid edge case issues
- Log when auto-deactivation occurs for audit trail
- Next AI response should work normally

### Invalid Conversation ID

**Scenario**: Takeover methods called with non-existent conversation ID

**Handling**:
- Return error response: `{ success: false, message: 'Conversación no encontrada' }`
- Log the attempt for debugging
- Do not throw exceptions

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Both are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across many randomized inputs.

### Property-Based Testing

**Library**: Use `fast-check` for TypeScript property-based testing

**Configuration**:
- Minimum 100 iterations per property test
- Each test must reference its design document property
- Tag format: `// Feature: persist-human-takeover-state, Property N: [property text]`

**Property Test Examples**:

```typescript
// Feature: persist-human-takeover-state, Property 1: Takeover State Persistence
test('Property 1: Starting takeover persists state to database', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.uuid(), // conversationId
      fc.string({ minLength: 1, maxLength: 50 }), // agentId
      async (conversationId, agentId) => {
        // Setup: Create conversation in database
        await setupTestConversation(conversationId);
        
        // Action: Start takeover
        const result = await HumanTakeoverService.startTakeover(
          conversationId,
          agentId
        );
        
        // Verify: Database has correct state
        if (result.success) {
          const state = await ConversationModel.getHumanTakeoverState(conversationId);
          expect(state).not.toBeNull();
          expect(state!.active).toBe(true);
          expect(state!.agentId).toBe(agentId);
          expect(state!.lastMessageTime).not.toBeNull();
        }
        
        // Cleanup
        await cleanupTestConversation(conversationId);
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: persist-human-takeover-state, Property 4: Timeout Auto-Deactivation
test('Property 4: Expired takeover sessions auto-deactivate', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.uuid(), // conversationId
      fc.string({ minLength: 1, maxLength: 50 }), // agentId
      fc.integer({ min: 61, max: 120 }), // minutes ago (> 1 hour)
      async (conversationId, agentId, minutesAgo) => {
        // Setup: Create conversation with old timestamp
        await setupTestConversation(conversationId);
        const oldTimestamp = new Date(Date.now() - minutesAgo * 60 * 1000);
        await db('conversations')
          .where({ id: conversationId })
          .update({
            human_takeover_active: true,
            human_takeover_agent_id: agentId,
            last_human_message_time: oldTimestamp
          });
        
        // Action: Check if under human control
        const isUnderControl = await HumanTakeoverService.isUnderHumanControl(
          conversationId
        );
        
        // Verify: Should be false and database should be updated
        expect(isUnderControl).toBe(false);
        const state = await ConversationModel.getHumanTakeoverState(conversationId);
        expect(state!.active).toBe(false);
        
        // Cleanup
        await cleanupTestConversation(conversationId);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing

**Focus Areas**:
- Specific examples of takeover start/end
- Error conditions (invalid conversation ID, database errors)
- Edge cases (exactly 1 hour timeout, concurrent takeover attempts)
- Integration with existing endpoints
- Migration execution and schema verification

**Unit Test Examples**:

```typescript
describe('HumanTakeoverService - Database Persistence', () => {
  test('should persist takeover state when starting takeover', async () => {
    const conversationId = 'test-conv-123';
    const agentId = 'agent-456';
    
    await setupTestConversation(conversationId);
    
    const result = await HumanTakeoverService.startTakeover(
      conversationId,
      agentId
    );
    
    expect(result.success).toBe(true);
    
    const state = await ConversationModel.getHumanTakeoverState(conversationId);
    expect(state).not.toBeNull();
    expect(state!.active).toBe(true);
    expect(state!.agentId).toBe(agentId);
  });

  test('should return false for expired takeover (> 1 hour)', async () => {
    const conversationId = 'test-conv-789';
    const agentId = 'agent-101';
    
    await setupTestConversation(conversationId);
    
    // Set takeover with timestamp 2 hours ago
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    await db('conversations')
      .where({ id: conversationId })
      .update({
        human_takeover_active: true,
        human_takeover_agent_id: agentId,
        last_human_message_time: twoHoursAgo
      });
    
    const isUnderControl = await HumanTakeoverService.isUnderHumanControl(
      conversationId
    );
    
    expect(isUnderControl).toBe(false);
  });

  test('should handle database errors gracefully', async () => {
    // Mock database to throw error
    jest.spyOn(ConversationModel, 'getHumanTakeoverState')
      .mockRejectedValueOnce(new Error('Database connection failed'));
    
    const isUnderControl = await HumanTakeoverService.isUnderHumanControl(
      'any-conversation-id'
    );
    
    // Should default to false to allow AI responses
    expect(isUnderControl).toBe(false);
  });

  test('should prevent concurrent takeover by different agents', async () => {
    const conversationId = 'test-conv-concurrent';
    const agent1 = 'agent-1';
    const agent2 = 'agent-2';
    
    await setupTestConversation(conversationId);
    
    // Agent 1 takes control
    const result1 = await HumanTakeoverService.startTakeover(
      conversationId,
      agent1
    );
    expect(result1.success).toBe(true);
    
    // Agent 2 tries to take control
    const result2 = await HumanTakeoverService.startTakeover(
      conversationId,
      agent2
    );
    expect(result2.success).toBe(false);
    expect(result2.message).toContain('ya está siendo controlada');
  });
});

describe('Database Migration', () => {
  test('should add human takeover columns to conversations table', async () => {
    // Verify columns exist
    const columns = await db('conversations').columnInfo();
    
    expect(columns).toHaveProperty('human_takeover_active');
    expect(columns).toHaveProperty('human_takeover_agent_id');
    expect(columns).toHaveProperty('last_human_message_time');
  });

  test('should create index on human_takeover_active', async () => {
    const indexes = await db.raw(`
      SHOW INDEX FROM conversations WHERE Key_name = 'idx_human_takeover_active'
    `);
    
    expect(indexes[0].length).toBeGreaterThan(0);
  });

  test('should not modify existing conversation data', async () => {
    // This would be tested by setting up data before migration
    // and verifying it's unchanged after migration
    const conversationsBefore = await db('conversations').select('*');
    
    // Run migration (in test environment)
    // await runMigration('038_add_human_takeover_to_conversations.sql');
    
    const conversationsAfter = await db('conversations').select('*');
    
    // Verify core data unchanged (id, client_id, channel, etc.)
    expect(conversationsBefore.length).toBe(conversationsAfter.length);
  });
});
```

### Integration Testing

**Scenarios**:
1. Full takeover lifecycle: start → send messages → end
2. Timeout scenario: start → wait > 1 hour → verify AI responds
3. Server restart simulation: persist state → restart service → verify state restored
4. Dashboard integration: API endpoints return correct state

### Test Data Management

**Setup**:
- Use test database with same schema as production
- Create helper functions for setting up test conversations
- Clean up test data after each test

**Helpers**:
```typescript
async function setupTestConversation(conversationId: string): Promise<void> {
  await db('clients').insert({
    id: `client-${conversationId}`,
    name: 'Test Client',
    phone: '+1234567890'
  });
  
  await db('conversations').insert({
    id: conversationId,
    client_id: `client-${conversationId}`,
    channel: 'whatsapp',
    status: 'active',
    context: JSON.stringify({ lastMessages: [], variables: {} })
  });
}

async function cleanupTestConversation(conversationId: string): Promise<void> {
  await db('conversations').where({ id: conversationId }).delete();
  await db('clients').where({ id: `client-${conversationId}` }).delete();
}
```

### Performance Testing

**Metrics to verify**:
- `isUnderHumanControl()` query time < 10ms
- `clearExpiredTakeovers()` can process 1000+ conversations in < 1 second
- Index on `human_takeover_active` is being used (verify with EXPLAIN)

### Backward Compatibility Testing

**Verify**:
- Existing API endpoints return same response format
- Dashboard can still call `/takeover/:conversationId/start` and `/takeover/:conversationId/end`
- Response status codes unchanged
- Error messages unchanged

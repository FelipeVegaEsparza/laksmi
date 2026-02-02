# Implementation Plan: Persist Human Takeover State

## Overview

This implementation plan converts the human takeover state from in-memory storage to database persistence. The work is organized into discrete steps: database migration, model updates, service updates, testing, and cleanup. Each task builds on previous steps to ensure incremental progress and early validation.

## Tasks

- [x] 1. Create database migration for human takeover columns
  - Create migration file `038_add_human_takeover_to_conversations.sql`
  - Add three columns: `human_takeover_active` (BOOLEAN), `human_takeover_agent_id` (VARCHAR), `last_human_message_time` (TIMESTAMP)
  - Add index on `human_takeover_active` for query performance
  - Include clear comments describing the purpose
  - Follow project's migration template format
  - _Requirements: 5.1, 5.2, 5.3, 6.2, 6.3, 6.4, 6.5_

- [ ] 2. Add database methods to ConversationModel
  - [x] 2.1 Implement `setHumanTakeover()` method
    - Accept conversationId, agentId, and active boolean
    - Update database with takeover state
    - Set or clear agent_id and timestamp based on active flag
    - _Requirements: 1.1_

  - [x] 2.2 Implement `updateLastHumanMessageTime()` method
    - Accept conversationId
    - Update `last_human_message_time` to current timestamp
    - _Requirements: 2.1_

  - [x] 2.3 Implement `getHumanTakeoverState()` method
    - Accept conversationId
    - Query and return takeover state (active, agentId, lastMessageTime)
    - Return null if conversation not found
    - _Requirements: 1.3, 4.1_

  - [x] 2.4 Implement `clearExpiredTakeovers()` method
    - Find all conversations with active takeover and timestamp > 1 hour old
    - Update them to inactive state
    - Return count of cleared sessions
    - _Requirements: 5.4_

  - [x] 2.5 Write property test for setHumanTakeover
    - **Property 1: Takeover State Persistence**
    - **Validates: Requirements 1.1, 1.4**

  - [x] 2.6 Write unit tests for ConversationModel takeover methods
    - Test setHumanTakeover with various inputs
    - Test getHumanTakeoverState returns correct data
    - Test clearExpiredTakeovers with expired and active sessions
    - _Requirements: 1.1, 1.3, 2.1, 5.4_

- [ ] 3. Update HumanTakeoverService to use database
  - [x] 3.1 Update `isUnderHumanControl()` to query database
    - Remove in-memory Map check
    - Call `ConversationModel.getHumanTakeoverState()`
    - Implement 1-hour timeout logic
    - Auto-deactivate if timeout expired
    - Add error handling (default to false on database errors)
    - _Requirements: 1.3, 2.2, 2.3, 2.4_

  - [x] 3.2 Update `startTakeover()` to persist to database
    - Remove in-memory Map operations
    - Call `ConversationModel.setHumanTakeover()` to persist state
    - Check existing state from database instead of Map
    - Keep all existing logic for context updates and system messages
    - _Requirements: 1.1, 3.1, 3.3_

  - [x] 3.3 Update `sendHumanMessage()` to update timestamp
    - Remove in-memory timestamp update
    - Call `ConversationModel.updateLastHumanMessageTime()` after sending message
    - Keep all existing message sending logic
    - _Requirements: 2.1_

  - [x] 3.4 Update `endTakeover()` to clear database state
    - Remove in-memory Map operations
    - Call `ConversationModel.setHumanTakeover()` to deactivate
    - Check state from database instead of Map
    - Keep all existing logic for context updates and system messages
    - _Requirements: 3.2, 3.4_

  - [x] 3.5 Write property test for database-backed control check
    - **Property 2: Database-Backed Control Check**
    - **Validates: Requirements 1.3**

  - [x] 3.6 Write property test for timeout auto-deactivation
    - **Property 4: Timeout Auto-Deactivation**
    - **Validates: Requirements 2.2, 2.3, 2.4**

  - [x] 3.7 Write unit tests for updated service methods
    - Test isUnderHumanControl with various database states
    - Test timeout logic (< 1 hour, > 1 hour, exactly 1 hour)
    - Test error handling (database errors, invalid conversation IDs)
    - Test concurrent takeover attempts
    - _Requirements: 1.3, 2.2, 2.3, 2.4, 3.1, 3.2_

- [x] 4. Checkpoint - Ensure all tests pass
  - Run all unit tests and property tests
  - Verify migration can be applied successfully
  - Ask the user if questions arise

- [ ] 5. Remove in-memory Map and cleanup old code
  - [x] 5.1 Remove `activeSessions` Map from HumanTakeoverService
    - Delete the `private static activeSessions` declaration
    - Remove any remaining Map operations
    - _Requirements: 1.2_

  - [x] 5.2 Update methods that used the Map
    - Update `getActiveSession()` to query database
    - Update `getAgentSessions()` to query database
    - Update `getSessionStats()` to query database
    - Update `cleanupInactiveSessions()` to use database cleanup
    - Update `pauseTakeover()` and `resumeTakeover()` to use database
    - Update `transferControl()` to use database
    - _Requirements: 1.2, 1.3_

  - [x] 5.3 Write unit tests for updated helper methods
    - Test getActiveSession returns correct database state
    - Test getAgentSessions queries database correctly
    - _Requirements: 1.2, 1.3_

- [ ] 6. Add periodic cleanup job
  - [x] 6.1 Create cleanup scheduler
    - Add setInterval in server initialization
    - Call `ConversationModel.clearExpiredTakeovers()` every 5 minutes
    - Log results when sessions are cleared
    - Add error handling
    - _Requirements: 2.3, 2.4_

  - [x] 6.2 Write property test for efficient cleanup
    - **Property 6: Efficient Cleanup**
    - **Validates: Requirements 5.4**

- [ ] 7. Update ConversationModel.formatConversation()
  - [x] 7.1 Add new fields to Conversation interface
    - Add humanTakeoverActive, humanTakeoverAgentId, lastHumanMessageTime
    - Update TypeScript interface in types/ai.ts
    - _Requirements: 1.4_

  - [x] 7.2 Update formatConversation to include new fields
    - Map database columns to interface properties
    - Handle null values appropriately
    - _Requirements: 1.4, 4.1_

- [ ] 8. Integration testing
  - [x] 8.1 Write property test for endpoint database persistence
    - **Property 5: Endpoint Database Persistence**
    - **Validates: Requirements 3.3, 3.4**

  - [x] 8.2 Write integration tests for full takeover lifecycle
    - Test start → send messages → end flow
    - Test start → timeout → AI responds flow
    - Test concurrent takeover attempts
    - Verify database state at each step
    - _Requirements: 1.1, 2.1, 2.3, 3.1, 3.2, 3.3, 3.4_

  - [x] 8.3 Write backward compatibility tests
    - Test `/takeover/:conversationId/start` endpoint response format
    - Test `/takeover/:conversationId/end` endpoint response format
    - Verify status codes unchanged
    - Verify error messages unchanged
    - _Requirements: 3.1, 3.2, 3.5_

- [x] 9. Final checkpoint - Ensure all tests pass
  - Run complete test suite
  - Verify no regressions in existing functionality
  - Test migration on clean database
  - Ask the user if questions arise

## Notes

- All tests are required for comprehensive coverage
- The migration (task 1) should be applied before testing other tasks
- User needs to restart backend after migration: `docker-compose restart backend`
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- Integration tests verify end-to-end flows work correctly

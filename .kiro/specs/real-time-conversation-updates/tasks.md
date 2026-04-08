# Implementation Plan: Real-Time Conversation Updates

## Overview

This implementation adds real-time WebSocket-based conversation state synchronization between backend and dashboard. The feature leverages the existing Socket.IO infrastructure (RealTimeNotificationService) to emit conversation state update events whenever conversations are escalated or human takeover state changes. The dashboard's NotificationContext will handle these events and update the UI within 1 second, eliminating the need for manual page refreshes.

## Tasks

- [x] 1. Add conversation state update event emission to backend
  - [x] 1.1 Add sendConversationStateUpdate method to RealTimeNotificationService
    - Create new static method that emits 'conversation_state_updated' events
    - Accept parameters: conversationId, status, humanTakeoverActive, agentId (optional)
    - Construct event payload with all required fields and ISO 8601 timestamp
    - Emit event to all connected authenticated dashboard clients
    - Add error handling to log failures without breaking state changes
    - _Requirements: 1.4, 5.4, 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ]* 1.2 Write property test for event payload structure validity
    - **Property 2: Event Payload Structure Validity**
    - **Validates: Requirements 5.4, 9.1, 9.2, 9.3, 9.4, 9.5**
    - Generate random conversation state changes
    - Verify emitted events contain all required fields with correct types
    - Verify agentId is present when humanTakeoverActive is true

- [x] 2. Instrument backend models and controllers to emit events
  - [x] 2.1 Add event emission to ConversationModel.escalateConversation
    - Call sendConversationStateUpdate after status update to 'escalated'
    - Pass conversationId, new status, humanTakeoverActive flag, and agentId
    - Wrap in try-catch to prevent emission failures from breaking escalation
    - _Requirements: 5.1, 1.4_
  
  - [x] 2.2 Add event emission to ConversationModel.updateStatus
    - Call sendConversationStateUpdate after any status change
    - Determine humanTakeoverActive from conversation context
    - Handle all status transitions (active, escalated, resolved)
    - _Requirements: 5.1, 1.4_
  
  - [x] 2.3 Add event emission to HumanTakeoverController.startTakeover
    - Call sendConversationStateUpdate after successful takeover start
    - Set status to 'escalated' and humanTakeoverActive to true
    - Include agentId from authenticated request
    - _Requirements: 5.2, 1.4_
  
  - [x] 2.4 Add event emission to HumanTakeoverController.endTakeover
    - Call sendConversationStateUpdate after successful takeover end
    - Set status to 'active' and humanTakeoverActive to false
    - Clear agentId from payload
    - _Requirements: 5.3, 1.4_
  
  - [ ]* 2.5 Write property test for event emission on state changes
    - **Property 1: Event Emission on State Changes**
    - **Validates: Requirements 1.4, 5.1, 5.2, 5.3**
    - Generate random conversation state change operations
    - Mock emit function and verify it's called with correct parameters
    - Test all state transition paths (escalation, takeover start/end, status updates)

- [ ] 3. Checkpoint - Verify backend event emission
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Extend dashboard NotificationContext to handle conversation state events
  - [x] 4.1 Add conversation state cache to NotificationContext
    - Add conversationStateCache Map to NotificationState interface
    - Create ConversationStateCache type with status, humanTakeoverActive, agentId, lastUpdate
    - Add reducer actions for updating conversation state cache
    - Implement getConversationState method to retrieve cached state
    - _Requirements: 6.2, 6.3_
  
  - [x] 4.2 Add conversation_state_updated event handler
    - Register Socket.IO listener for 'conversation_state_updated' events
    - Validate event payload structure before processing
    - Update conversation state cache with new state
    - Trigger subscribed callbacks with updated conversationId
    - Add error handling for invalid payloads
    - _Requirements: 1.5, 6.1, 6.2_
  
  - [x] 4.3 Implement subscription mechanism for components
    - Create subscribeToConversationUpdates method accepting callback function
    - Return unsubscribe function for cleanup
    - Maintain list of active subscriptions
    - Call all subscribed callbacks when conversation state updates
    - _Requirements: 6.2_
  
  - [ ]* 4.4 Write property test for dashboard state update correctness
    - **Property 3: Dashboard State Update Correctness**
    - **Validates: Requirements 1.5, 6.2, 6.3, 6.4**
    - Generate random valid events and initial states
    - Verify state update logic produces correct output
    - Test conversations array updates, selectedConversation updates, aiEnabled map updates

- [x] 5. Add audio notification for escalations
  - [x] 5.1 Create useEscalationAudio hook
    - Create custom React hook that manages Audio element
    - Initialize audio with notification sound file at 50% volume
    - Expose playNotification callback function
    - Handle audio playback errors gracefully (catch promise rejections)
    - Log errors without showing to user
    - _Requirements: 3.1, 3.2, 3.4_
  
  - [x] 5.2 Integrate audio notification in NotificationContext
    - Use useEscalationAudio hook in NotificationContext
    - Play notification when conversation_state_updated event indicates escalation
    - Track played escalations to prevent duplicate sounds
    - Only play for new escalations (status transition to 'escalated')
    - Do not play for conversations already escalated
    - _Requirements: 3.1, 3.3, 3.5_
  
  - [ ]* 5.3 Write property test for audio notification idempotence
    - **Property 4: Audio Notification Idempotence**
    - **Validates: Requirements 3.1, 3.3, 3.5**
    - Generate random event sequences with duplicates and escalations
    - Mock audio.play() and count invocations
    - Verify audio plays exactly once per unique escalation event

- [x] 6. Update ConversationsPage to subscribe to real-time updates
  - [x] 6.1 Subscribe to conversation updates in ConversationsPage
    - Use subscribeToConversationUpdates from NotificationContext
    - Set up subscription in useEffect with cleanup
    - Handle conversation state updates in callback
    - _Requirements: 1.5, 6.2_
  
  - [x] 6.2 Update conversations array on state change events
    - Map over conversations array and update matching conversation
    - Preserve all other conversation properties
    - Update status and humanTakeoverActive from event
    - Maintain existing sort order
    - _Requirements: 1.1, 1.2, 4.1, 4.4_
  
  - [x] 6.3 Update selectedConversation on state change events
    - Check if event conversationId matches selectedConversation.id
    - Update selectedConversation state with new status and humanTakeoverActive
    - Preserve all other selectedConversation properties
    - _Requirements: 1.1, 1.2, 2.1_
  
  - [x] 6.4 Update aiEnabled map on state change events
    - Update aiEnabled map entry for conversationId
    - Set to true when humanTakeoverActive is false
    - Set to false when humanTakeoverActive is true
    - Ensure toggle button reflects new state
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 6.4_
  
  - [x] 6.5 Update conversation list status indicators
    - Update status badge in conversation list items
    - Show "Solicita atención" indicator for escalated conversations without active takeover
    - Remove indicator when conversation transitions to active
    - Update lastActivity timestamp from event timestamp
    - _Requirements: 4.1, 4.2, 4.3, 4.5_
  
  - [ ]* 6.6 Write property test for conversation list sort order preservation
    - **Property 5: Conversation List Sort Order Preservation**
    - **Validates: Requirements 4.4**
    - Generate random sorted conversation lists and state updates
    - Verify sort order is maintained after applying updates
    - Test with various sort criteria
  
  - [ ]* 6.7 Write property test for lastActivity timestamp update
    - **Property 6: LastActivity Timestamp Update**
    - **Validates: Requirements 4.5**
    - Generate random conversations and events with timestamps
    - Verify lastActivity is updated to match event timestamp

- [ ] 7. Checkpoint - Verify dashboard real-time updates
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Add debouncing and performance optimizations
  - [x] 8.1 Add debouncing to state updates in NotificationContext
    - Implement 300ms debounce for rapid state update sequences
    - Use lodash.debounce or custom debounce implementation
    - Ensure only last update in window triggers state change
    - Prevent excessive re-renders from rapid events
    - _Requirements: 10.3_
  
  - [ ]* 8.2 Write property test for debouncing behavior
    - **Property 8: Debouncing Behavior**
    - **Validates: Requirements 10.3**
    - Generate random rapid update sequences within debounce window
    - Verify only last update triggers state change
    - Test with various timing patterns

- [x] 9. Add rate limiting to backend event emission
  - [x] 9.1 Implement rate limiting in sendConversationStateUpdate
    - Use token bucket algorithm to limit events to 100 per second per conversation
    - Track event counts per conversation with timestamps
    - Drop events exceeding rate limit and log warning
    - Reset counters every second
    - _Requirements: 10.4_
  
  - [ ]* 9.2 Write property test for rate limiting
    - **Property 9: Rate Limiting**
    - **Validates: Requirements 10.4**
    - Generate rapid state changes exceeding 100 per second
    - Verify no more than 100 events emitted per second per conversation
    - Test with multiple conversations simultaneously

- [x] 10. Add graceful degradation and error handling
  - [x] 10.1 Add WebSocket connection status indicator to dashboard
    - Create connection status component showing connected/disconnected state
    - Update status based on Socket.IO connection events
    - Display indicator in dashboard header or notification area
    - _Requirements: 7.3_
  
  - [x] 10.2 Implement automatic reconnection logic
    - Use Socket.IO's built-in reconnection mechanism
    - On reconnect, fetch current conversation states to resynchronize
    - Update conversation state cache with fresh data
    - Log reconnection events
    - _Requirements: 7.2, 7.4_
  
  - [x] 10.3 Add error handling for invalid event payloads
    - Validate event structure before processing in NotificationContext
    - Check for required fields and correct types
    - Log validation errors without updating state
    - Continue listening for valid events
    - _Requirements: 7.4_
  
  - [x] 10.4 Ensure polling fallback continues working
    - Verify existing 10-second polling interval remains active
    - Ensure polling works when WebSocket is disconnected
    - Test that polling catches state changes when WebSocket fails
    - _Requirements: 7.1_

- [x] 11. Add multi-tab synchronization support
  - [x] 11.1 Verify multi-tab event broadcasting
    - Test that backend emits events to all connected sockets for same user
    - Verify each dashboard tab maintains separate WebSocket connection
    - Ensure state updates propagate to all tabs
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [x] 11.2 Add conflict resolution for multi-tab state updates
    - Use event timestamp to resolve conflicts (newer wins)
    - Ignore events older than current local state
    - Log conflicts for debugging
    - Maintain state consistency across tabs
    - _Requirements: 8.4, 8.5_
  
  - [ ]* 11.3 Write property test for multi-tab state synchronization
    - **Property 7: Multi-Tab State Synchronization**
    - **Validates: Requirements 8.5**
    - Generate random state updates from external sources
    - Verify local state synchronizes without conflicts
    - Test with various timing and conflict scenarios

- [x] 12. Final checkpoint and integration testing
  - [ ]* 12.1 Write integration tests for end-to-end WebSocket flow
    - Start backend and establish WebSocket connection
    - Trigger conversation state changes in backend
    - Verify events received in dashboard within 1 second
    - Verify UI updates correctly
    - Test all state transition paths
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [ ]* 12.2 Write integration tests for multi-tab synchronization
    - Open multiple simulated dashboard connections
    - Trigger state change in backend
    - Verify all connections receive update
    - Verify state consistency across connections
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ]* 12.3 Write integration tests for fallback to polling
    - Disconnect WebSocket connection
    - Trigger state change in backend
    - Verify polling catches update within 10 seconds
    - Reconnect WebSocket and verify resynchronization
    - _Requirements: 7.1, 7.2, 7.4_

- [x] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties from the design document
- Integration tests validate end-to-end flows and multi-component interactions
- This is an additive feature - no database migrations required
- Existing polling (10s interval) remains as fallback mechanism
- Must maintain backward compatibility with existing functionality

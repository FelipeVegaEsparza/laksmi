# Requirements Document

## Introduction

This feature implements real-time conversation state updates in the dashboard to eliminate the need for manual page refreshes when conversation states change. Currently, when a conversation is escalated (by AI or user action), the dashboard toggle button (IA/Humano) doesn't update immediately, requiring users to manually refresh the page. This feature will leverage the existing WebSocket infrastructure to push state updates to the dashboard in real-time, ensuring the UI always reflects the current conversation state.

## Glossary

- **Dashboard**: The React-based administrative interface where agents manage conversations
- **Conversation_State**: The current status of a conversation (active, escalated, resolved)
- **Toggle_Button**: The UI switch that controls whether AI or human agent handles the conversation
- **WebSocket_Service**: The Socket.IO-based real-time notification service on the backend
- **Notification_Context**: The React context that manages WebSocket connections in the dashboard
- **Escalation**: The process of transferring a conversation from AI to human agent control
- **Human_Takeover**: The state where a human agent has active control of a conversation
- **Conversation_List**: The list of conversations displayed in the dashboard sidebar

## Requirements

### Requirement 1: Real-Time Conversation State Synchronization

**User Story:** As an agent, I want the dashboard to automatically update when conversation states change, so that I always see accurate information without manual refreshes.

#### Acceptance Criteria

1. WHEN a conversation status changes from 'active' to 'escalated', THE Dashboard SHALL update the conversation state within 1 second
2. WHEN a conversation status changes from 'escalated' to 'active', THE Dashboard SHALL update the conversation state within 1 second
3. WHEN the humanTakeoverActive flag changes, THE Dashboard SHALL update the toggle button state within 1 second
4. THE Backend SHALL emit 'conversation_state_updated' events via WebSocket whenever conversation state changes
5. THE Dashboard SHALL listen for 'conversation_state_updated' events and update the local state accordingly

### Requirement 2: Toggle Button Real-Time Synchronization

**User Story:** As an agent, I want the toggle button (IA/Humano) to automatically reflect the current conversation state, so that I know who is handling the conversation without checking manually.

#### Acceptance Criteria

1. WHEN a 'conversation_state_updated' event is received, THE Dashboard SHALL update the toggle button position to match the new state
2. WHEN conversation status is 'escalated', THE Toggle_Button SHALL display in the 'Humano' position
3. WHEN conversation status is 'active', THE Toggle_Button SHALL display in the 'IA' position
4. WHEN the currently selected conversation is updated, THE Dashboard SHALL update the toggle button immediately
5. WHEN a conversation in the list (not selected) is updated, THE Dashboard SHALL update the conversation list item status indicator

### Requirement 3: Escalation Notification with Audio Alert

**User Story:** As an agent, I want to hear a notification sound when a conversation is escalated, so that I can respond immediately to customers needing human assistance.

#### Acceptance Criteria

1. WHEN a conversation is escalated, THE Dashboard SHALL play a notification sound
2. THE Notification_Sound SHALL be subtle and non-intrusive (volume at 50% or configurable)
3. THE Dashboard SHALL play the notification sound only once per escalation event
4. IF the browser blocks audio playback, THE Dashboard SHALL log the error without breaking functionality
5. THE Dashboard SHALL NOT play notification sounds for conversations that are already escalated

### Requirement 4: Conversation List Real-Time Updates

**User Story:** As an agent, I want the conversation list to update automatically when conversation states change, so that I can see which conversations need attention without refreshing.

#### Acceptance Criteria

1. WHEN a conversation state changes, THE Conversation_List SHALL update the status badge within 1 second
2. WHEN a conversation is escalated, THE Conversation_List SHALL display a visual indicator (e.g., "Solicita atención")
3. WHEN a conversation transitions from escalated to active, THE Conversation_List SHALL remove the escalation indicator
4. THE Conversation_List SHALL maintain sort order when states update
5. THE Conversation_List SHALL update the lastActivity timestamp when state changes occur

### Requirement 5: Backend WebSocket Event Emission

**User Story:** As a system, I want to emit WebSocket events whenever conversation states change, so that all connected dashboard clients receive real-time updates.

#### Acceptance Criteria

1. WHEN ConversationModel.escalateConversation is called, THE Backend SHALL emit a 'conversation_state_updated' event
2. WHEN human takeover is started via /human-takeover/:id/start, THE Backend SHALL emit a 'conversation_state_updated' event
3. WHEN human takeover is ended via /human-takeover/:id/end, THE Backend SHALL emit a 'conversation_state_updated' event
4. THE 'conversation_state_updated' event SHALL include conversationId, status, humanTakeoverActive, and timestamp
5. THE Backend SHALL emit events to all connected dashboard clients with appropriate permissions

### Requirement 6: Dashboard WebSocket Event Handling

**User Story:** As a dashboard, I want to handle conversation state update events efficiently, so that the UI updates smoothly without performance issues.

#### Acceptance Criteria

1. THE Notification_Context SHALL register a listener for 'conversation_state_updated' events
2. WHEN a 'conversation_state_updated' event is received, THE Dashboard SHALL update the conversations state array
3. WHEN the updated conversation is currently selected, THE Dashboard SHALL update the selectedConversation state
4. THE Dashboard SHALL update the aiEnabled state map to reflect the new conversation state
5. THE Dashboard SHALL handle multiple rapid state updates without race conditions

### Requirement 7: Graceful Degradation

**User Story:** As an agent, I want the dashboard to continue functioning if WebSocket connection fails, so that I can still work even with degraded real-time features.

#### Acceptance Criteria

1. IF the WebSocket connection fails, THE Dashboard SHALL continue polling conversations every 10 seconds
2. IF the WebSocket connection is lost, THE Dashboard SHALL attempt to reconnect automatically
3. THE Dashboard SHALL display a connection status indicator when WebSocket is disconnected
4. WHEN WebSocket reconnects, THE Dashboard SHALL request current conversation states to resynchronize
5. THE Dashboard SHALL log WebSocket errors without displaying error messages to users

### Requirement 8: Multi-Tab Synchronization

**User Story:** As an agent, I want all my open dashboard tabs to stay synchronized, so that I see consistent information across all tabs.

#### Acceptance Criteria

1. WHEN a conversation state changes, THE Backend SHALL emit events to all connected sockets for the same user
2. WHEN an agent has multiple dashboard tabs open, THE Dashboard SHALL update all tabs when state changes occur
3. THE Dashboard SHALL maintain separate WebSocket connections for each tab
4. WHEN one tab updates a conversation state, THE Backend SHALL broadcast the update to all other tabs
5. THE Dashboard SHALL handle state updates from other tabs without conflicts

### Requirement 9: Event Payload Structure

**User Story:** As a developer, I want conversation state update events to have a consistent structure, so that the dashboard can reliably parse and handle them.

#### Acceptance Criteria

1. THE 'conversation_state_updated' event payload SHALL include conversationId (string)
2. THE 'conversation_state_updated' event payload SHALL include status (string: 'active' | 'escalated' | 'resolved')
3. THE 'conversation_state_updated' event payload SHALL include humanTakeoverActive (boolean)
4. THE 'conversation_state_updated' event payload SHALL include timestamp (ISO 8601 string)
5. THE 'conversation_state_updated' event payload SHALL optionally include agentId (string) when human takeover is active

### Requirement 10: Performance and Scalability

**User Story:** As a system administrator, I want real-time updates to be efficient, so that the system can handle multiple concurrent agents without performance degradation.

#### Acceptance Criteria

1. THE Backend SHALL emit conversation state updates only to authenticated dashboard clients
2. THE Backend SHALL use Socket.IO rooms to target specific conversation updates when applicable
3. THE Dashboard SHALL debounce rapid state updates to prevent excessive re-renders
4. THE Backend SHALL limit conversation state update events to 100 per second per conversation
5. THE Dashboard SHALL handle up to 50 conversation state updates per second without UI lag

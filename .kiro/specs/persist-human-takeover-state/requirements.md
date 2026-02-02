# Requirements Document

## Introduction

This document specifies the requirements for persisting human takeover control state in the database to ensure the AI toggle switch in the dashboard correctly prevents AI responses across server restarts. Currently, the human takeover state is stored in memory and is lost when the server restarts, causing the AI to respond even when the dashboard switch indicates human control is active.

## Glossary

- **Human_Takeover_Service**: The backend service responsible for managing human control sessions
- **Conversation**: A WhatsApp conversation thread between a user and the system
- **Active_Session**: A conversation currently under human control where AI responses are disabled
- **Dashboard**: The React-based administrative interface for managing conversations
- **Takeover_State**: The current status of human control for a conversation (active or inactive)
- **Timeout_Period**: The 1-hour duration after which AI automatically reactivates if no human messages are sent

## Requirements

### Requirement 1: Persist Human Takeover State

**User Story:** As a system administrator, I want the human takeover state to persist in the database, so that the AI remains disabled across server restarts when I have taken control of a conversation.

#### Acceptance Criteria

1. WHEN a human takeover session is started, THE Human_Takeover_Service SHALL store the takeover state in the database
2. WHEN the server restarts, THE Human_Takeover_Service SHALL retrieve active takeover states from the database
3. WHEN checking if a conversation is under human control, THE Human_Takeover_Service SHALL query the database instead of in-memory storage
4. THE database SHALL store the conversation ID, takeover status, and last human message timestamp for each active session

### Requirement 2: Maintain Timeout Functionality

**User Story:** As a system administrator, I want the AI to automatically reactivate after 1 hour of inactivity, so that conversations don't remain indefinitely under human control when I forget to re-enable the AI.

#### Acceptance Criteria

1. WHEN a human sends a message during an active takeover session, THE Human_Takeover_Service SHALL update the last human message timestamp in the database
2. WHEN checking if a conversation is under human control, THE Human_Takeover_Service SHALL verify that less than 1 hour has passed since the last human message
3. IF more than 1 hour has passed since the last human message, THEN THE Human_Takeover_Service SHALL automatically end the takeover session and allow AI responses
4. WHEN the timeout period expires, THE Human_Takeover_Service SHALL update the database to reflect the inactive state

### Requirement 3: Backward Compatible API

**User Story:** As a dashboard developer, I want the existing takeover endpoints to continue working without changes, so that the frontend doesn't require modifications.

#### Acceptance Criteria

1. THE Human_Takeover_Service SHALL maintain the existing `/takeover/:conversationId/start` endpoint behavior
2. THE Human_Takeover_Service SHALL maintain the existing `/takeover/:conversationId/end` endpoint behavior
3. WHEN the start endpoint is called, THE Human_Takeover_Service SHALL persist the state to the database and return success
4. WHEN the end endpoint is called, THE Human_Takeover_Service SHALL update the database and return success
5. THE endpoint response format SHALL remain unchanged from the current implementation

### Requirement 4: Dashboard State Synchronization

**User Story:** As a system administrator, I want the dashboard toggle switch to accurately reflect the current takeover state from the database, so that I can see the true state of AI control.

#### Acceptance Criteria

1. WHEN the dashboard loads a conversation, THE system SHALL query the database for the current takeover state
2. WHEN the takeover state changes, THE dashboard SHALL reflect the updated state from the database
3. THE dashboard toggle switch SHALL display the active state when a takeover session exists in the database
4. THE dashboard toggle switch SHALL display the inactive state when no active takeover session exists in the database

### Requirement 5: Database Schema Design

**User Story:** As a database administrator, I want a clear and efficient schema for storing takeover state, so that queries are fast and the data model is maintainable.

#### Acceptance Criteria

1. THE system SHALL add a column to the conversations table OR create a new human_takeover_sessions table to store takeover state
2. THE database schema SHALL include fields for conversation_id, is_active, and last_human_message_time
3. WHEN querying takeover state, THE system SHALL use indexed fields for optimal performance
4. THE database schema SHALL support efficient cleanup of expired sessions

### Requirement 6: Migration Safety

**User Story:** As a developer, I want the database migration to be safe and reversible, so that I can deploy the change without risk of data loss.

#### Acceptance Criteria

1. THE migration SHALL be a simple change (adding columns or creating a table)
2. THE migration SHALL include clear comments describing the purpose
3. THE migration SHALL follow the project's sequential numbering convention (009_*.sql)
4. THE migration SHALL not modify or delete existing data
5. WHEN the migration executes, THE system SHALL create the necessary schema without errors

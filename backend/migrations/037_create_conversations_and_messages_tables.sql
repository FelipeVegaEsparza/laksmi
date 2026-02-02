-- backend/migrations/037_create_conversations_and_messages_tables.sql

-- Descripción: Crear tablas para conversaciones y mensajes del chatbot
-- Relacionado con: Sistema de chat web y WhatsApp

-- ============================================
-- CREAR TABLA CONVERSATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS conversations (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  client_id CHAR(36) NOT NULL,
  channel ENUM('web', 'whatsapp') NOT NULL DEFAULT 'web',
  status ENUM('active', 'escalated', 'closed') NOT NULL DEFAULT 'active',
  context JSON DEFAULT NULL,
  last_activity TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Índices
  INDEX idx_client_id (client_id),
  INDEX idx_channel (channel),
  INDEX idx_status (status),
  INDEX idx_last_activity (last_activity),
  INDEX idx_client_channel_status (client_id, channel, status),
  
  -- Foreign keys
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CREAR TABLA MESSAGES
-- ============================================

CREATE TABLE IF NOT EXISTS messages (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  conversation_id CHAR(36) NOT NULL,
  sender_type ENUM('client', 'ai', 'agent') NOT NULL,
  content TEXT NOT NULL,
  media_url VARCHAR(500) DEFAULT NULL,
  metadata JSON DEFAULT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Índices
  INDEX idx_conversation_id (conversation_id),
  INDEX idx_sender_type (sender_type),
  INDEX idx_timestamp (timestamp),
  INDEX idx_conversation_timestamp (conversation_id, timestamp),
  
  -- Foreign keys
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- NOTAS
-- ============================================

-- Esta migración crea las tablas necesarias para el sistema de chat:
-- 
-- conversations: Almacena las conversaciones entre clientes y el sistema
--   - Soporta canales web y whatsapp
--   - Estados: active (bot respondiendo), escalated (control humano), closed (finalizada)
--   - context: JSON con historial de mensajes y variables de contexto
--
-- messages: Almacena todos los mensajes de las conversaciones
--   - sender_type: client (usuario), ai (bot), agent (humano)
--   - metadata: JSON con información adicional (intent, entities, etc.)

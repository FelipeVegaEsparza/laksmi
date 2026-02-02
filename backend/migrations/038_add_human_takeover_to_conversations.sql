-- backend/migrations/038_add_human_takeover_to_conversations.sql

-- Descripción: Agregar columnas para persistir el estado de control humano (human takeover)
-- Relacionado con: Sistema de control humano de conversaciones - Persist Human Takeover State

-- ============================================
-- AGREGAR COLUMNAS DE HUMAN TAKEOVER
-- ============================================

-- Agregar columna para indicar si la conversación está bajo control humano
ALTER TABLE conversations
ADD COLUMN human_takeover_active BOOLEAN DEFAULT FALSE COMMENT 'Indica si la conversación está actualmente bajo control humano';

-- Agregar columna para almacenar el ID del agente humano que tiene control
ALTER TABLE conversations
ADD COLUMN human_takeover_agent_id VARCHAR(255) DEFAULT NULL COMMENT 'ID del agente humano que controla la conversación';

-- Agregar columna para almacenar el timestamp del último mensaje humano (para timeout de 1 hora)
ALTER TABLE conversations
ADD COLUMN last_human_message_time TIMESTAMP NULL DEFAULT NULL COMMENT 'Timestamp del último mensaje enviado por el agente humano';

-- ============================================
-- CREAR ÍNDICE PARA OPTIMIZAR CONSULTAS
-- ============================================

-- Índice en human_takeover_active para optimizar consultas de estado de control
CREATE INDEX idx_human_takeover_active ON conversations(human_takeover_active);

-- ============================================
-- NOTAS
-- ============================================

-- Esta migración agrega persistencia de estado para el sistema de control humano:
-- 
-- human_takeover_active: Flag booleano que indica si un agente humano tiene control
--   - FALSE (default): El bot AI responde automáticamente
--   - TRUE: El bot está desactivado y solo el agente humano puede responder
--
-- human_takeover_agent_id: Identificador del agente que tomó control
--   - Se usa para auditoría y para prevenir que otro agente tome control simultáneamente
--   - Se limpia (NULL) cuando el control humano termina
--
-- last_human_message_time: Timestamp del último mensaje del agente
--   - Se usa para implementar el timeout de 1 hora
--   - Si pasa más de 1 hora sin mensajes del agente, el bot se reactiva automáticamente
--   - Se actualiza cada vez que el agente envía un mensaje
--
-- El índice en human_takeover_active optimiza las consultas frecuentes para verificar
-- si una conversación está bajo control humano antes de generar respuestas del bot.
--
-- IMPORTANTE: Después de aplicar esta migración, reiniciar el backend:
--   docker-compose restart backend


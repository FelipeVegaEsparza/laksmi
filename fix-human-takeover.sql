-- ============================================
-- FIX: Desactivar control humano en conversaciones
-- ============================================
-- Este script desactiva el control humano en conversaciones
-- para que el bot pueda volver a responder

-- ============================================
-- OPCIÓN 1: Desactivar control humano en UNA conversación específica
-- ============================================

-- Primero, ver qué conversaciones tienen control humano activo
SELECT 
  id,
  client_id,
  channel,
  status,
  human_takeover_active,
  human_takeover_agent_id,
  last_human_message_time,
  created_at
FROM conversations
WHERE human_takeover_active = TRUE
ORDER BY last_human_message_time DESC;

-- Si quieres desactivar el control humano en una conversación específica:
-- Reemplaza 'CONVERSATION_ID_AQUI' con el ID de la conversación
-- UPDATE conversations 
-- SET 
--   human_takeover_active = FALSE,
--   human_takeover_agent_id = NULL,
--   status = 'active'
-- WHERE id = 'CONVERSATION_ID_AQUI';

-- ============================================
-- OPCIÓN 2: Desactivar control humano en TODAS las conversaciones
-- ============================================

-- ⚠️ CUIDADO: Esto desactivará el control humano en TODAS las conversaciones
-- Solo ejecutar si estás seguro

UPDATE conversations 
SET 
  human_takeover_active = FALSE,
  human_takeover_agent_id = NULL,
  status = 'active'
WHERE human_takeover_active = TRUE;

-- ============================================
-- OPCIÓN 3: Desactivar control humano en conversaciones inactivas (más de 1 hora)
-- ============================================

-- Desactivar solo en conversaciones donde el último mensaje humano fue hace más de 1 hora
-- UPDATE conversations 
-- SET 
--   human_takeover_active = FALSE,
--   human_takeover_agent_id = NULL,
--   status = 'active'
-- WHERE human_takeover_active = TRUE
--   AND last_human_message_time < DATE_SUB(NOW(), INTERVAL 1 HOUR);

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Ver el estado después del cambio
SELECT 
  id,
  client_id,
  channel,
  status,
  human_takeover_active,
  human_takeover_agent_id,
  last_human_message_time,
  created_at
FROM conversations
WHERE id IN (
  SELECT DISTINCT conversation_id 
  FROM messages 
  WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
)
ORDER BY created_at DESC
LIMIT 20;

-- ============================================
-- FIN
-- ============================================

SELECT '✅ Control humano desactivado' as status;

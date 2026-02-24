-- ============================================
-- FIX ESPECÍFICO: Desactivar control humano en conversación 9dd43f5e-1170-11f1-a790-02420a0b0014
-- ============================================

-- Ver el estado actual de la conversación
SELECT 
  id,
  client_id,
  channel,
  status,
  human_takeover_active,
  human_takeover_agent_id,
  last_human_message_time,
  created_at,
  updated_at
FROM conversations
WHERE id = '9dd43f5e-1170-11f1-a790-02420a0b0014';

-- Desactivar el control humano en esta conversación específica
UPDATE conversations 
SET 
  human_takeover_active = FALSE,
  human_takeover_agent_id = NULL,
  status = 'active',
  updated_at = NOW()
WHERE id = '9dd43f5e-1170-11f1-a790-02420a0b0014';

-- Verificar que se aplicó el cambio
SELECT 
  id,
  client_id,
  channel,
  status,
  human_takeover_active,
  human_takeover_agent_id,
  last_human_message_time,
  created_at,
  updated_at
FROM conversations
WHERE id = '9dd43f5e-1170-11f1-a790-02420a0b0014';

-- Ver los últimos mensajes de esta conversación
SELECT 
  id,
  conversation_id,
  sender_type,
  content,
  created_at
FROM messages
WHERE conversation_id = '9dd43f5e-1170-11f1-a790-02420a0b0014'
ORDER BY created_at DESC
LIMIT 10;

SELECT '✅ Control humano desactivado en conversación 9dd43f5e-1170-11f1-a790-02420a0b0014' as status;

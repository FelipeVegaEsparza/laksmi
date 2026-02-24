-- FIX: Desactivar control humano en TODAS las conversaciones
-- Esto liberará todas las conversaciones para que la IA pueda responder

UPDATE conversations 
SET 
    human_takeover_active = 0,
    human_takeover_agent_id = NULL,
    last_human_message_time = NULL,
    status = 'active',
    updated_at = NOW()
WHERE human_takeover_active = 1;

-- Verificar el resultado
SELECT 
    COUNT(*) as conversaciones_liberadas
FROM conversations 
WHERE human_takeover_active = 0;

-- Ver las conversaciones que quedaron con control humano (debería ser 0)
SELECT 
    COUNT(*) as conversaciones_con_control_humano
FROM conversations 
WHERE human_takeover_active = 1;

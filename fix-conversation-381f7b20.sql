-- FIX: Liberar conversación 381f7b20 del control humano

UPDATE conversations 
SET 
    human_takeover_active = 0,
    human_takeover_agent_id = NULL,
    last_human_message_time = NULL,
    status = 'active',
    updated_at = NOW()
WHERE id = '1fa-07a7-c17f-d1-111f-a790-0242ac0a0014';

-- Verificar el cambio
SELECT 
    id,
    status,
    human_takeover_active,
    human_takeover_agent_id,
    last_human_message_time,
    updated_at
FROM conversations 
WHERE id = '1fa-07a7-c17f-d1-111f-a790-0242ac0a0014';

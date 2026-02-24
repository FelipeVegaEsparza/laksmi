-- Verificar el estado de la conversación web_d80c9959

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
WHERE id LIKE '%d80c9959%' OR client_id LIKE '%d80c9959%'
ORDER BY created_at DESC;

-- Ver los últimos mensajes de esa conversación
SELECT 
    c.id as conversation_id,
    m.id as message_id,
    m.sender_type,
    m.content,
    m.created_at
FROM conversations c
LEFT JOIN messages m ON c.id = m.conversation_id
WHERE c.id LIKE '%d80c9959%' OR c.client_id LIKE '%d80c9959%'
ORDER BY m.created_at DESC
LIMIT 20;

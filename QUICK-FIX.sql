-- ============================================
-- QUICK FIX: Desactivar control humano AHORA
-- ============================================
-- Ejecuta este script para que el bot vuelva a responder inmediatamente

-- Desactivar control humano en TODAS las conversaciones activas
UPDATE conversations 
SET 
  human_takeover_active = FALSE,
  human_takeover_agent_id = NULL,
  status = 'active',
  updated_at = NOW()
WHERE human_takeover_active = TRUE;

-- Verificar el cambio
SELECT 
  COUNT(*) as conversaciones_liberadas
FROM conversations
WHERE human_takeover_active = FALSE
  AND updated_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE);

SELECT '✅ Bot reactivado - Prueba enviando un mensaje en el chat' as resultado;

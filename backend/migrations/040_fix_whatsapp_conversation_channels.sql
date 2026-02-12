-- backend/migrations/040_fix_whatsapp_conversation_channels.sql

-- Descripción: Corregir el campo channel en conversaciones de WhatsApp existentes
-- Relacionado con: Fix para que los mensajes del Dashboard se envíen por WhatsApp

-- ============================================
-- CAMBIOS
-- ============================================

-- Actualizar conversaciones que tienen clientes con número de teléfono chileno
-- y que no tienen el canal configurado como 'whatsapp'
UPDATE conversations c
INNER JOIN clients cl ON c.client_id = cl.id
SET c.channel = 'whatsapp',
    c.updated_at = NOW()
WHERE (c.channel IS NULL OR c.channel != 'whatsapp')
  AND cl.phone IS NOT NULL
  AND cl.phone LIKE '+56%';

-- ============================================
-- NOTAS
-- ============================================

-- Esta migración corrige el problema donde las conversaciones de WhatsApp
-- no tenían el campo 'channel' configurado correctamente, lo que impedía
-- que los mensajes del Dashboard se enviaran por WhatsApp al cliente.
-- 
-- Solo actualiza conversaciones de clientes con números chilenos (+56)
-- que tienen teléfono registrado.

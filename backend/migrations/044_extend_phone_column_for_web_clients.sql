-- backend/migrations/044_extend_phone_column_for_web_clients.sql

-- Descripción: Extender el campo phone de la tabla clients para soportar UUIDs de clientes web
-- Relacionado con: Fix web chat client creation - Task 5 (real-time-conversation-updates spec)

-- ============================================
-- CAMBIOS
-- ============================================

-- Extender el campo phone de VARCHAR(20) a VARCHAR(50) para soportar UUIDs (36 caracteres)
-- Esto permite almacenar tanto números de teléfono como UUIDs para clientes web
ALTER TABLE clients
  MODIFY COLUMN phone VARCHAR(50) NOT NULL;

-- ============================================
-- NOTAS
-- ============================================

-- El campo phone ahora puede almacenar:
-- - Números de teléfono: +56912345678 (hasta 20 caracteres)
-- - UUIDs para clientes web: dc40d067-c49a-4fe6-b3d2-199fb81e6837 (36 caracteres)
-- - El índice único existente (idx_clients_phone_unique) sigue funcionando correctamente

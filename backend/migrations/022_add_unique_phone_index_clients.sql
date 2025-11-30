-- backend/migrations/022_add_unique_phone_index_clients.sql

-- Descripción: Agregar índice único en el campo phone de la tabla clients para prevenir duplicados
-- Relacionado con: Spec chatbot-whatsapp-revision - Task 1

-- ============================================
-- PASO 1: LIMPIAR DUPLICADOS EXISTENTES
-- ============================================

-- Identificar y fusionar clientes duplicados por teléfono
-- Mantener el cliente más antiguo (creado primero) y mover sus datos

-- Crear tabla temporal con clientes a mantener (el más antiguo de cada teléfono)
CREATE TEMPORARY TABLE clients_to_keep AS
SELECT MIN(id) as id, phone
FROM clients
GROUP BY phone;

-- Mover reservas de clientes duplicados al cliente principal
UPDATE bookings b
INNER JOIN clients c ON b.client_id = c.id
INNER JOIN clients_to_keep ctk ON c.phone = ctk.phone
SET b.client_id = ctk.id
WHERE b.client_id != ctk.id;

-- Mover conversaciones de clientes duplicados al cliente principal
UPDATE conversations conv
INNER JOIN clients c ON conv.client_id = c.id
INNER JOIN clients_to_keep ctk ON c.phone = ctk.phone
SET conv.client_id = ctk.id
WHERE conv.client_id != ctk.id;

-- Eliminar clientes duplicados (mantener solo el más antiguo)
DELETE c FROM clients c
LEFT JOIN clients_to_keep ctk ON c.id = ctk.id
WHERE ctk.id IS NULL;

-- Limpiar tabla temporal
DROP TEMPORARY TABLE clients_to_keep;

-- ============================================
-- PASO 2: AGREGAR ÍNDICE ÚNICO
-- ============================================

-- Agregar índice único en el campo phone para prevenir duplicados futuros
ALTER TABLE clients
ADD UNIQUE INDEX idx_clients_phone_unique (phone);

-- ============================================
-- NOTAS
-- ============================================

-- 1. Esta migración primero limpia duplicados existentes
-- 2. Luego agrega un índice único para prevenir duplicados futuros
-- 3. Las reservas y conversaciones se preservan moviéndolas al cliente principal
-- 4. El cliente principal es el más antiguo (MIN(id))
-- 5. Si hay errores de duplicados, verificar manualmente con:
--    SELECT phone, COUNT(*) FROM clients GROUP BY phone HAVING COUNT(*) > 1;

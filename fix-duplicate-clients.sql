-- ============================================
-- Script para Limpiar Clientes Duplicados
-- ============================================
-- Fecha: 2025-01-26
-- Propósito: Fusionar clientes con el mismo email en uno solo
-- IMPORTANTE: Hacer backup antes de ejecutar!

-- ============================================
-- PASO 1: VERIFICAR DUPLICADOS (Solo lectura)
-- ============================================

-- Ver todos los emails duplicados
SELECT email, COUNT(*) as cantidad, GROUP_CONCAT(id) as client_ids
FROM clients
WHERE email IS NOT NULL AND email != ''
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY cantidad DESC;

-- Ver detalles de los clientes con email 'felipevegaesparza@gmail.com'
SELECT 
    id,
    name,
    email,
    phone,
    created_at,
    (SELECT COUNT(*) FROM bookings WHERE client_id = clients.id) as num_reservas
FROM clients
WHERE email = 'felipevegaesparza@gmail.com'
ORDER BY created_at ASC;

-- ============================================
-- PASO 2: IDENTIFICAR CLIENTE PRINCIPAL
-- ============================================

-- El cliente principal será el que tenga:
-- 1. Más reservas
-- 2. Nombre real (no "Web Visitor")
-- 3. Teléfono real (no "web_xxxxx")
-- 4. Creado primero

-- Para 'felipevegaesparza@gmail.com', el cliente principal es:
-- ID: 50bc26d1-c277-11f0-8d42-02420a000390
-- Nombre: Felipe Andrés Vega Esparza
-- Teléfono: +56921911216

-- ============================================
-- PASO 3: MOVER RESERVAS AL CLIENTE PRINCIPAL
-- ============================================

-- Mover todas las reservas de los clientes duplicados al cliente principal
UPDATE bookings 
SET client_id = '50bc26d1-c277-11f0-8d42-02420a000390'
WHERE client_id IN (
    SELECT id FROM (
        SELECT id FROM clients 
        WHERE email = 'felipevegaesparza@gmail.com'
        AND id != '50bc26d1-c277-11f0-8d42-02420a000390'
    ) AS temp
);

-- Verificar que las reservas se movieron
SELECT 
    client_id,
    COUNT(*) as num_reservas
FROM bookings
WHERE client_id IN (
    SELECT id FROM clients 
    WHERE email = 'felipevegaesparza@gmail.com'
)
GROUP BY client_id;

-- ============================================
-- PASO 4: MOVER CONVERSACIONES (si existen)
-- ============================================

-- Verificar si hay conversaciones
SELECT 
    client_id,
    COUNT(*) as num_conversaciones
FROM conversations
WHERE client_id IN (
    SELECT id FROM clients 
    WHERE email = 'felipevegaesparza@gmail.com'
)
GROUP BY client_id;

-- Mover conversaciones al cliente principal
UPDATE conversations 
SET client_id = '50bc26d1-c277-11f0-8d42-02420a000390'
WHERE client_id IN (
    SELECT id FROM (
        SELECT id FROM clients 
        WHERE email = 'felipevegaesparza@gmail.com'
        AND id != '50bc26d1-c277-11f0-8d42-02420a000390'
    ) AS temp
);

-- ============================================
-- PASO 5: ELIMINAR CLIENTES DUPLICADOS
-- ============================================

-- Eliminar los clientes duplicados (ahora sin reservas ni conversaciones)
DELETE FROM clients 
WHERE email = 'felipevegaesparza@gmail.com'
AND id != '50bc26d1-c277-11f0-8d42-02420a000390';

-- Verificar que solo queda un cliente
SELECT 
    id,
    name,
    email,
    phone,
    (SELECT COUNT(*) FROM bookings WHERE client_id = clients.id) as num_reservas
FROM clients
WHERE email = 'felipevegaesparza@gmail.com';

-- ============================================
-- PASO 6: LIMPIAR OTROS DUPLICADOS (OPCIONAL)
-- ============================================

-- Si hay otros emails duplicados, puedes usar este template:
/*
-- 1. Identificar el cliente principal para cada email
SELECT 
    email,
    id,
    name,
    phone,
    created_at,
    (SELECT COUNT(*) FROM bookings WHERE client_id = clients.id) as num_reservas
FROM clients
WHERE email IN (
    SELECT email FROM clients
    WHERE email IS NOT NULL AND email != ''
    GROUP BY email
    HAVING COUNT(*) > 1
)
ORDER BY email, num_reservas DESC, created_at ASC;

-- 2. Para cada email duplicado, ejecutar:
-- UPDATE bookings SET client_id = 'CLIENTE_PRINCIPAL_ID' WHERE client_id IN (...);
-- UPDATE conversations SET client_id = 'CLIENTE_PRINCIPAL_ID' WHERE client_id IN (...);
-- DELETE FROM clients WHERE email = 'EMAIL' AND id != 'CLIENTE_PRINCIPAL_ID';
*/

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

-- Verificar que no quedan duplicados
SELECT email, COUNT(*) as cantidad
FROM clients
WHERE email IS NOT NULL AND email != ''
GROUP BY email
HAVING COUNT(*) > 1;

-- Si no retorna nada, ¡éxito! No hay duplicados

-- ============================================
-- NOTAS
-- ============================================
-- 1. Este script es seguro porque primero mueve las reservas antes de eliminar
-- 2. Si algo sale mal, puedes restaurar desde el backup
-- 3. Después de ejecutar, prueba el chatbot de nuevo
-- 4. Las conversaciones antiguas de los clientes duplicados se preservan

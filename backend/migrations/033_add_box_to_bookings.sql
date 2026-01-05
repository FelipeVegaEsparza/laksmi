-- backend/migrations/033_add_box_to_bookings.sql

-- Descripción: Agregar columna box a tabla bookings para sistema de 2 boxes
-- Relacionado con: Sistema de gestión de 2 boxes de atención

-- ============================================
-- CAMBIOS
-- ============================================

-- Agregar columna box a bookings
ALTER TABLE bookings 
ADD COLUMN box ENUM('box1', 'box2') NULL AFTER professional_id;

-- ============================================
-- NOTAS
-- ============================================

-- La columna box es nullable para mantener compatibilidad con citas existentes
-- Valores permitidos: 'box1', 'box2', o NULL
-- Las citas existentes tendrán box = NULL hasta que se asignen manualmente
-- El sistema de disponibilidad verificará ambos boxes antes de marcar un slot como no disponible

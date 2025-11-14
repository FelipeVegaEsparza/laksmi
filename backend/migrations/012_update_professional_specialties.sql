-- backend/migrations/012_update_professional_specialties.sql

-- Descripción: Actualizar especialidades del profesional por defecto con todos los servicios
-- Relacionado con: Sistema de reservas - asignar servicios al profesional

-- ============================================
-- CAMBIOS
-- ============================================

-- Actualizar el profesional por defecto para que pueda realizar todos los servicios existentes
UPDATE professionals 
SET specialties = (
  SELECT CONCAT('[', GROUP_CONCAT(CONCAT('"', id, '"')), ']')
  FROM services 
  WHERE is_active = TRUE
)
WHERE name = 'Profesional General';

-- ============================================
-- NOTAS
-- ============================================

-- Esta migración asigna todos los servicios activos al profesional por defecto
-- Esto permite que el sistema de reservas funcione inmediatamente
-- Los administradores pueden crear profesionales específicos más tarde
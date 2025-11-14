-- backend/migrations/009_add_sessions_and_tag_to_services.sql

-- Descripción: Agregar campos de cantidad de sesiones y etiqueta a servicios
-- Relacionado con: Mejora de información de servicios

-- ============================================
-- CAMBIOS
-- ============================================

ALTER TABLE services 
ADD COLUMN sessions INT DEFAULT 1 COMMENT 'Cantidad de sesiones recomendadas',
ADD COLUMN tag VARCHAR(50) DEFAULT NULL COMMENT 'Etiqueta del servicio (ej: Popular, Nuevo, Oferta)';

-- ============================================
-- NOTAS
-- ============================================

-- sessions: Número de sesiones recomendadas para el tratamiento (por defecto 1)
-- tag: Etiqueta opcional para destacar el servicio (Popular, Nuevo, Oferta, etc.)

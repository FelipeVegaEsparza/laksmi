-- backend/migrations/016_add_benefits_to_services.sql

-- Descripción: Agregar campo de beneficios a servicios
-- Relacionado con: Mejora de información de servicios

-- ============================================
-- CAMBIOS
-- ============================================

ALTER TABLE services 
ADD COLUMN benefits TEXT DEFAULT NULL COMMENT 'Beneficios del servicio';

-- ============================================
-- NOTAS
-- ============================================

-- benefits: Texto descriptivo de los beneficios del servicio (opcional)

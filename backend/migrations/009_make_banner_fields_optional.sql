-- backend/migrations/009_make_banner_fields_optional.sql

-- Descripción: Hacer campos de texto de banners opcionales
-- Relacionado con: Permitir banners solo con imagen

-- ============================================
-- CAMBIOS
-- ============================================

-- Hacer el campo title opcional (permitir NULL)
ALTER TABLE banners MODIFY COLUMN title VARCHAR(255) NULL;

-- ============================================
-- NOTAS
-- ============================================

-- Ahora los banners pueden tener solo imagen sin título ni descripción

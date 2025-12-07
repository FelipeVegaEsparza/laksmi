-- backend/migrations/026_add_maintenance_mode_to_company_settings.sql

-- Descripción: Agregar campo maintenance_mode a company_settings
-- Relacionado con: Feature de modo mantenimiento para el frontend

-- ============================================
-- CAMBIOS
-- ============================================

ALTER TABLE company_settings 
ADD COLUMN maintenance_mode BOOLEAN DEFAULT FALSE COMMENT 'Indica si el sitio está en modo mantenimiento';

-- ============================================
-- NOTAS
-- ============================================

-- Este campo permite activar/desactivar el modo mantenimiento del frontend
-- desde el dashboard administrativo
-- Por defecto está en FALSE (sitio activo)

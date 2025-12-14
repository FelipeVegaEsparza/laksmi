-- backend/migrations/031_add_is_featured_to_services.sql

-- Descripción: Agregar campo is_featured para destacar servicios en la página principal
-- Relacionado con: Sistema de servicios destacados

-- ============================================
-- CAMBIOS
-- ============================================

-- Agregar columna is_featured a la tabla services
ALTER TABLE services 
ADD COLUMN is_featured BOOLEAN DEFAULT FALSE COMMENT 'Indica si el servicio debe destacarse en la página principal';

-- Crear índice para búsquedas rápidas de servicios destacados
CREATE INDEX idx_services_featured ON services(is_featured);

-- Marcar el servicio específico como destacado
UPDATE services 
SET is_featured = TRUE 
WHERE id = 'f9a4de5f-d2ad-11f0-98ab-02420a0b0010';

-- ============================================
-- NOTAS
-- ============================================

-- Solo debe haber un servicio destacado a la vez para mejor UX
-- El dashboard permitirá cambiar cuál servicio está destacado

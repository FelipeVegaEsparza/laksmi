-- backend/migrations/034_add_is_active_to_products.sql

-- Descripción: Agregar columna is_active a la tabla products para poder activar/desactivar productos
-- Relacionado con: Feature de activación/desactivación de productos en el dashboard

-- ============================================
-- CAMBIOS
-- ============================================

ALTER TABLE products 
ADD COLUMN is_active BOOLEAN DEFAULT TRUE NOT NULL AFTER compatible_services;

-- ============================================
-- NOTAS
-- ============================================

-- Por defecto todos los productos existentes quedarán activos (TRUE)
-- Los productos inactivos no se mostrarán en el frontend público

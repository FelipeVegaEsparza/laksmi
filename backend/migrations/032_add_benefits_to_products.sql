-- backend/migrations/032_add_benefits_to_products.sql

-- Descripción: Agregar campo benefits a la tabla products
-- Relacionado con: Feature de beneficios en productos (igual que servicios)

-- ============================================
-- CAMBIOS
-- ============================================

ALTER TABLE products 
ADD COLUMN benefits TEXT DEFAULT NULL AFTER description;

-- ============================================
-- NOTAS
-- ============================================

-- El campo benefits permite almacenar HTML con formato enriquecido
-- Similar al campo benefits en la tabla services
-- Permite describir los beneficios del producto de forma detallada

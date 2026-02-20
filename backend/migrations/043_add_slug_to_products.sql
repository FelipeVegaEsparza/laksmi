-- backend/migrations/043_add_slug_to_products.sql

-- Descripción: Agregar columna slug a productos para URLs amigables con SEO
-- Relacionado con: Mejora de SEO y usabilidad de URLs

-- ============================================
-- CAMBIOS
-- ============================================

-- Agregar columna slug
ALTER TABLE products 
ADD COLUMN slug VARCHAR(255) NULL;

-- Crear índice único para slug
CREATE UNIQUE INDEX idx_products_slug ON products(slug);

-- ============================================
-- NOTAS
-- ============================================

-- Los slugs se generarán automáticamente mediante script
-- después de ejecutar esta migración

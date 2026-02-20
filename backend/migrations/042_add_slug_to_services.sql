-- backend/migrations/042_add_slug_to_services.sql

-- Descripción: Agregar columna slug a servicios para URLs amigables con SEO
-- Relacionado con: Mejora de SEO y usabilidad de URLs

-- ============================================
-- CAMBIOS
-- ============================================

-- Agregar columna slug
ALTER TABLE services 
ADD COLUMN slug VARCHAR(255) NULL;

-- Crear índice único para slug
CREATE UNIQUE INDEX idx_services_slug ON services(slug);

-- ============================================
-- NOTAS
-- ============================================

-- Los slugs se generarán automáticamente mediante script
-- después de ejecutar esta migración
-- El script populate-service-slugs.js se encargará de:
-- 1. Generar slugs desde los nombres de servicios
-- 2. Manejar duplicados agregando sufijos numéricos
-- 3. Hacer la columna NOT NULL después de poblarla

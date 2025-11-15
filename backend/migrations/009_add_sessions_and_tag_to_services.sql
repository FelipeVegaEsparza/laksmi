-- backend/migrations/009_add_sessions_and_tag_to_services.sql

-- Descripción: Agregar campos de cantidad de sesiones y etiqueta a servicios
-- Relacionado con: Mejora de información de servicios

-- ============================================
-- CAMBIOS
-- ============================================

-- Agregar columna sessions si no existe
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'services' 
AND COLUMN_NAME = 'sessions';

SET @query = IF(@col_exists = 0,
  'ALTER TABLE services ADD COLUMN sessions INT DEFAULT 1 COMMENT ''Cantidad de sesiones recomendadas''',
  'SELECT ''Column sessions already exists'' AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar columna tag si no existe
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'services' 
AND COLUMN_NAME = 'tag';

SET @query = IF(@col_exists = 0,
  'ALTER TABLE services ADD COLUMN tag VARCHAR(50) DEFAULT NULL COMMENT ''Etiqueta del servicio (ej: Popular, Nuevo, Oferta)''',
  'SELECT ''Column tag already exists'' AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- NOTAS
-- ============================================

-- sessions: Número de sesiones recomendadas para el tratamiento (por defecto 1)
-- tag: Etiqueta opcional para destacar el servicio (Popular, Nuevo, Oferta, etc.)
-- Esta migración es idempotente: puede ejecutarse múltiples veces sin causar errores

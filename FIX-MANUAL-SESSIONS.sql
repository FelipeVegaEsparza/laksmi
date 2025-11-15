-- Script para agregar manualmente las columnas sessions y tag a la tabla services
-- Ejecutar este script si las migraciones automáticas no funcionan

-- 1. Eliminar el registro de la migración 009 si existe (para que pueda ejecutarse de nuevo)
DELETE FROM schema_migrations WHERE filename = '009_add_sessions_and_tag_to_services.sql';

-- 2. Agregar columna sessions (ignorar error si ya existe)
ALTER TABLE services ADD COLUMN sessions INT DEFAULT 1 COMMENT 'Cantidad de sesiones recomendadas';

-- 3. Agregar columna tag (ignorar error si ya existe)
ALTER TABLE services ADD COLUMN tag VARCHAR(50) DEFAULT NULL COMMENT 'Etiqueta del servicio';

-- 4. Registrar la migración como ejecutada
INSERT INTO schema_migrations (filename, executed_at) 
VALUES ('009_add_sessions_and_tag_to_services.sql', NOW());

-- 5. Verificar que las columnas se agregaron correctamente
DESCRIBE services;

-- 6. Verificar que la migración está registrada
SELECT * FROM schema_migrations ORDER BY id DESC LIMIT 5;

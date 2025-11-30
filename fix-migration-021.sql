-- Script para limpiar la migración fallida y permitir que se ejecute de nuevo

-- 1. Eliminar el registro de la migración fallida
DELETE FROM schema_migrations 
WHERE filename = '021_add_payment_info_to_company_settings.sql';

-- 2. Verificar que se eliminó
SELECT * FROM schema_migrations 
WHERE filename LIKE '%021%';

-- Ahora puedes reiniciar el backend y la migración se ejecutará correctamente

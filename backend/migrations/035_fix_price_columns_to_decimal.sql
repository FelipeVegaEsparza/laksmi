-- backend/migrations/035_fix_price_columns_to_decimal.sql

-- Descripción: Cambiar tipo de dato de columnas price a DECIMAL para guardar valores exactos
-- Relacionado con: Fix de aproximación de precios en productos y servicios

-- ============================================
-- CAMBIOS
-- ============================================

-- Modificar columna price en tabla services
ALTER TABLE services 
MODIFY COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- Modificar columna price en tabla products
ALTER TABLE products 
MODIFY COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- ============================================
-- NOTAS
-- ============================================

-- DECIMAL(10,2) permite:
-- - Hasta 10 dígitos en total
-- - 2 decimales de precisión
-- - Rango: -99,999,999.99 a 99,999,999.99
-- - Almacenamiento exacto sin aproximaciones

-- Si las columnas ya eran DECIMAL, esta migración no causará problemas
-- Si eran INT o FLOAT, se convertirán a DECIMAL preservando los datos existentes

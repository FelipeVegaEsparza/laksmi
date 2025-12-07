-- backend/migrations/025_add_multiple_categories_support.sql

-- Descripción: Agregar soporte para múltiples categorías en servicios y productos
-- Relacionado con: Sistema de categorías múltiples

-- ============================================
-- CREAR TABLAS DE UNIÓN (JUNCTION TABLES)
-- ============================================

-- Tabla de unión para servicios y categorías
CREATE TABLE IF NOT EXISTS service_categories (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  service_id CHAR(36) NOT NULL,
  category_name VARCHAR(100) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE COMMENT 'Indica si es la categoría principal',
  display_order INT DEFAULT 0 COMMENT 'Orden de visualización de las categorías',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  INDEX idx_service_category (service_id, category_name),
  INDEX idx_category_lookup (category_name),
  INDEX idx_primary_category (service_id, is_primary),
  UNIQUE KEY unique_service_category (service_id, category_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de unión para productos y categorías
CREATE TABLE IF NOT EXISTS product_categories (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  product_id CHAR(36) NOT NULL,
  category_name VARCHAR(100) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE COMMENT 'Indica si es la categoría principal',
  display_order INT DEFAULT 0 COMMENT 'Orden de visualización de las categorías',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_category (product_id, category_name),
  INDEX idx_category_lookup (category_name),
  INDEX idx_primary_category (product_id, is_primary),
  UNIQUE KEY unique_product_category (product_id, category_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- MIGRAR DATOS EXISTENTES
-- ============================================

-- Migrar categorías existentes de servicios a la tabla de unión
-- Solo migrar servicios que tienen una categoría definida
INSERT INTO service_categories (service_id, category_name, is_primary, display_order)
SELECT 
  id,
  category,
  TRUE,
  0
FROM services
WHERE category IS NOT NULL AND category != '';

-- Migrar categorías existentes de productos a la tabla de unión
-- Solo migrar productos que tienen una categoría definida
INSERT INTO product_categories (product_id, category_name, is_primary, display_order)
SELECT 
  id,
  category,
  TRUE,
  0
FROM products
WHERE category IS NOT NULL AND category != '';

-- ============================================
-- CREAR TRIGGERS PARA SINCRONIZACIÓN
-- ============================================

-- Trigger para sincronizar la categoría primaria en services cuando se actualiza en service_categories
DELIMITER //

CREATE TRIGGER sync_service_primary_category_after_insert
AFTER INSERT ON service_categories
FOR EACH ROW
BEGIN
  IF NEW.is_primary = TRUE THEN
    -- Actualizar la columna category en services con la categoría primaria
    UPDATE services 
    SET category = NEW.category_name 
    WHERE id = NEW.service_id;
    
    -- Asegurar que solo hay una categoría primaria
    UPDATE service_categories 
    SET is_primary = FALSE 
    WHERE service_id = NEW.service_id 
      AND id != NEW.id 
      AND is_primary = TRUE;
  END IF;
END//

CREATE TRIGGER sync_service_primary_category_after_update
AFTER UPDATE ON service_categories
FOR EACH ROW
BEGIN
  IF NEW.is_primary = TRUE AND OLD.is_primary = FALSE THEN
    -- Actualizar la columna category en services con la nueva categoría primaria
    UPDATE services 
    SET category = NEW.category_name 
    WHERE id = NEW.service_id;
    
    -- Asegurar que solo hay una categoría primaria
    UPDATE service_categories 
    SET is_primary = FALSE 
    WHERE service_id = NEW.service_id 
      AND id != NEW.id 
      AND is_primary = TRUE;
  END IF;
END//

-- Trigger para sincronizar la categoría primaria en products cuando se actualiza en product_categories
CREATE TRIGGER sync_product_primary_category_after_insert
AFTER INSERT ON product_categories
FOR EACH ROW
BEGIN
  IF NEW.is_primary = TRUE THEN
    -- Actualizar la columna category en products con la categoría primaria
    UPDATE products 
    SET category = NEW.category_name 
    WHERE id = NEW.product_id;
    
    -- Asegurar que solo hay una categoría primaria
    UPDATE product_categories 
    SET is_primary = FALSE 
    WHERE product_id = NEW.product_id 
      AND id != NEW.id 
      AND is_primary = TRUE;
  END IF;
END//

CREATE TRIGGER sync_product_primary_category_after_update
AFTER UPDATE ON product_categories
FOR EACH ROW
BEGIN
  IF NEW.is_primary = TRUE AND OLD.is_primary = FALSE THEN
    -- Actualizar la columna category en products con la nueva categoría primaria
    UPDATE products 
    SET category = NEW.category_name 
    WHERE id = NEW.product_id;
    
    -- Asegurar que solo hay una categoría primaria
    UPDATE product_categories 
    SET is_primary = FALSE 
    WHERE product_id = NEW.product_id 
      AND id != NEW.id 
      AND is_primary = TRUE;
  END IF;
END//

DELIMITER ;

-- ============================================
-- VERIFICACIÓN DE INTEGRIDAD
-- ============================================

-- Verificar que todos los servicios activos tienen al menos una categoría
-- (Esto es solo una consulta de verificación, no falla la migración)
SELECT 
  COUNT(*) as services_without_categories
FROM services s
LEFT JOIN service_categories sc ON s.id = sc.service_id
WHERE sc.id IS NULL;

-- Verificar que todos los productos tienen al menos una categoría
SELECT 
  COUNT(*) as products_without_categories
FROM products p
LEFT JOIN product_categories pc ON p.id = pc.product_id
WHERE pc.id IS NULL;

-- ============================================
-- NOTAS
-- ============================================

-- 1. La columna 'category' en las tablas services y products se mantiene para compatibilidad hacia atrás
-- 2. Los triggers aseguran que la columna 'category' siempre refleja la categoría primaria
-- 3. Cada servicio/producto debe tener exactamente una categoría marcada como is_primary=TRUE
-- 4. La eliminación de un servicio/producto eliminará automáticamente sus categorías (CASCADE)
-- 5. No se pueden duplicar categorías para el mismo servicio/producto (UNIQUE constraint)

-- Para verificar la migración exitosa, ejecutar:
-- SELECT s.name, s.category, sc.category_name, sc.is_primary 
-- FROM services s 
-- LEFT JOIN service_categories sc ON s.id = sc.service_id 
-- LIMIT 10;

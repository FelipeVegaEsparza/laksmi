-- ============================================
-- Migración 025: Agregar soporte de categorías múltiples
-- ============================================
-- Esta migración crea las tablas junction para soportar múltiples categorías
-- en servicios y productos, usando VARCHAR para compatibilidad

-- Crear tabla service_categories con VARCHAR
CREATE TABLE IF NOT EXISTS service_categories (
  id VARCHAR(36) PRIMARY KEY,
  service_id VARCHAR(36) NOT NULL,
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

-- Crear tabla product_categories con VARCHAR
CREATE TABLE IF NOT EXISTS product_categories (
  id VARCHAR(36) PRIMARY KEY,
  product_id VARCHAR(36) NOT NULL,
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

-- Migrar datos existentes de services
INSERT INTO service_categories (id, service_id, category_name, is_primary, display_order)
SELECT 
  UUID() as id,
  id as service_id,
  category as category_name,
  TRUE as is_primary,
  0 as display_order
FROM services
WHERE category IS NOT NULL 
  AND category != ''
  AND NOT EXISTS (
    SELECT 1 FROM service_categories sc 
    WHERE sc.service_id = services.id 
    AND sc.category_name = services.category
  );

-- Migrar datos existentes de products
INSERT INTO product_categories (id, product_id, category_name, is_primary, display_order)
SELECT 
  UUID() as id,
  id as product_id,
  category as category_name,
  TRUE as is_primary,
  0 as display_order
FROM products
WHERE category IS NOT NULL 
  AND category != ''
  AND NOT EXISTS (
    SELECT 1 FROM product_categories pc 
    WHERE pc.product_id = products.id 
    AND pc.category_name = products.category
  );

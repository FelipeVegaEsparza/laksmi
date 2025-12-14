-- backend/migrations/030_create_product_orders_table.sql

-- Descripción: Crear tabla para gestionar órdenes/ventas de productos
-- Relacionado con: Sistema de ventas de productos

-- ============================================
-- CAMBIOS
-- ============================================

-- Crear tabla sin foreign key primero (igual que migración 025)
CREATE TABLE IF NOT EXISTS product_orders (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  product_id VARCHAR(36) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  customer_address TEXT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  payment_status ENUM('pending', 'paid') DEFAULT 'pending',
  payment_link VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_product_id (product_id),
  INDEX idx_payment_status (payment_status),
  INDEX idx_created_at (created_at)
);

-- Agregar foreign key solo si no existe
-- Esto evita errores si la migración se ejecuta múltiples veces
SET @constraint_exists = (
  SELECT COUNT(*) 
  FROM information_schema.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'product_orders'
    AND CONSTRAINT_NAME = 'product_orders_ibfk_1'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @sql = IF(@constraint_exists = 0,
  'ALTER TABLE product_orders ADD CONSTRAINT product_orders_ibfk_1 FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE',
  'SELECT "Foreign key already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- NOTAS
-- ============================================

-- Esta tabla almacena todas las solicitudes de compra de productos
-- payment_status: 'pending' = no pagado, 'paid' = pagado
-- Se relaciona con la tabla products mediante product_id
-- Usa el mismo patrón que migración 025 (product_categories)


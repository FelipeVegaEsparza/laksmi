-- backend/migrations/030_create_product_orders_table.sql

-- Descripción: Crear tabla para gestionar órdenes/ventas de productos
-- Relacionado con: Sistema de ventas de productos

-- ============================================
-- CAMBIOS
-- ============================================

CREATE TABLE IF NOT EXISTS product_orders (
  id VARCHAR(36) PRIMARY KEY,
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
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id),
  INDEX idx_payment_status (payment_status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- NOTAS
-- ============================================

-- Esta tabla almacena todas las solicitudes de compra de productos
-- payment_status: 'pending' = no pagado, 'paid' = pagado
-- Se relaciona con la tabla products mediante product_id


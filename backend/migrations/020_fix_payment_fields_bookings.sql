-- backend/migrations/020_fix_payment_fields_bookings.sql

-- Descripción: Reparar campos de pago en bookings si no existen
-- Relacionado con: Fix para producción

-- ============================================
-- CAMBIOS
-- ============================================

-- Intentar agregar payment_amount (ignorar error si ya existe)
SET @sql = 'ALTER TABLE bookings ADD COLUMN payment_amount DECIMAL(10,2) DEFAULT 20000.00 AFTER notes';
SET @check = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_SCHEMA = DATABASE() 
              AND TABLE_NAME = 'bookings' 
              AND COLUMN_NAME = 'payment_amount');
SET @sql = IF(@check = 0, @sql, 'SELECT "payment_amount already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Intentar agregar payment_method (ignorar error si ya existe)
SET @sql = 'ALTER TABLE bookings ADD COLUMN payment_method VARCHAR(50) AFTER payment_amount';
SET @check = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_SCHEMA = DATABASE() 
              AND TABLE_NAME = 'bookings' 
              AND COLUMN_NAME = 'payment_method');
SET @sql = IF(@check = 0, @sql, 'SELECT "payment_method already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Intentar agregar payment_notes (ignorar error si ya existe)
SET @sql = 'ALTER TABLE bookings ADD COLUMN payment_notes TEXT AFTER payment_method';
SET @check = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_SCHEMA = DATABASE() 
              AND TABLE_NAME = 'bookings' 
              AND COLUMN_NAME = 'payment_notes');
SET @sql = IF(@check = 0, @sql, 'SELECT "payment_notes already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Intentar agregar paid_at (ignorar error si ya existe)
SET @sql = 'ALTER TABLE bookings ADD COLUMN paid_at DATETIME AFTER payment_notes';
SET @check = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_SCHEMA = DATABASE() 
              AND TABLE_NAME = 'bookings' 
              AND COLUMN_NAME = 'paid_at');
SET @sql = IF(@check = 0, @sql, 'SELECT "paid_at already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Actualizar enum de estados para incluir pending_payment
ALTER TABLE bookings 
  MODIFY COLUMN status ENUM(
    'pending_payment',
    'confirmed', 
    'completed', 
    'cancelled', 
    'no_show'
  ) DEFAULT 'confirmed';

-- ============================================
-- NOTAS
-- ============================================

-- Esta migración es idempotente y puede ejecutarse múltiples veces
-- Solo agrega las columnas si no existen usando prepared statements

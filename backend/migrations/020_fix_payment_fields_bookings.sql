-- backend/migrations/020_fix_payment_fields_bookings.sql

-- Descripción: Reparar campos de pago en bookings si no existen
-- Relacionado con: Fix para producción

-- ============================================
-- CAMBIOS
-- ============================================

-- Agregar campos de pago solo si no existen
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2) DEFAULT 20000.00 AFTER notes,
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) AFTER payment_amount,
  ADD COLUMN IF NOT EXISTS payment_notes TEXT AFTER payment_method,
  ADD COLUMN IF NOT EXISTS paid_at DATETIME AFTER payment_notes;

-- Actualizar enum de estados para incluir pending_payment si no está
ALTER TABLE bookings 
  MODIFY COLUMN status ENUM(
    'pending_payment',
    'confirmed', 
    'completed', 
    'cancelled', 
    'no_show'
  ) DEFAULT 'pending_payment';

-- ============================================
-- NOTAS
-- ============================================

-- Esta migración es idempotente y puede ejecutarse múltiples veces
-- Solo agrega las columnas si no existen

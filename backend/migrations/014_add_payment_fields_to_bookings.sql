-- backend/migrations/013_add_payment_fields_to_bookings.sql

-- Descripción: Agregar campos de pago y actualizar estados de reservas
-- Relacionado con: Sistema de pagos manual

-- ============================================
-- CAMBIOS
-- ============================================

-- 1. Actualizar enum de estados para incluir pending_payment
ALTER TABLE bookings 
  MODIFY COLUMN status ENUM(
    'pending_payment',
    'confirmed', 
    'completed', 
    'cancelled', 
    'no_show'
  ) DEFAULT 'pending_payment';

-- 2. Agregar campos de pago
ALTER TABLE bookings 
  ADD COLUMN payment_amount DECIMAL(10,2) DEFAULT 20000.00 AFTER notes,
  ADD COLUMN payment_method VARCHAR(50) AFTER payment_amount,
  ADD COLUMN payment_notes TEXT AFTER payment_method,
  ADD COLUMN paid_at DATETIME AFTER payment_notes;

-- 3. Actualizar reservas existentes con estado 'confirmed' para mantener compatibilidad
UPDATE bookings 
SET status = 'confirmed' 
WHERE status = 'confirmed';

-- 4. Agregar campo de link de pago en company_settings
ALTER TABLE company_settings
  ADD COLUMN payment_link TEXT AFTER contact_whatsapp,
  ADD COLUMN payment_instructions TEXT AFTER payment_link;

-- ============================================
-- NOTAS
-- ============================================

-- El monto por defecto es $20.000 pero puede ser modificado por reserva
-- El estado por defecto es 'pending_payment' pero puede ser cambiado al crear
-- payment_method puede ser: 'transferencia', 'mercadopago', 'efectivo', etc.
-- paid_at se actualiza cuando se confirma el pago

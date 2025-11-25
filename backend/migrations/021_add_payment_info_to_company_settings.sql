-- backend/migrations/021_add_payment_info_to_company_settings.sql

-- Descripción: Agregar campos de información de pago a company_settings
-- Relacionado con: Sistema de emails de reservas con estado pending_payment

-- ============================================
-- CAMBIOS
-- ============================================

-- Agregar columnas para información de pago
ALTER TABLE company_settings
ADD COLUMN payment_link VARCHAR(500) NULL COMMENT 'Link para realizar el pago (ej: link de pago online)',
ADD COLUMN payment_instructions TEXT NULL COMMENT 'Instrucciones de pago (transferencia, efectivo, etc.)';

-- ============================================
-- NOTAS
-- ============================================

-- payment_link: URL donde el cliente puede realizar el pago online
-- payment_instructions: Texto con instrucciones de cómo pagar (datos bancarios, etc.)
-- Estos campos se usan en los emails de confirmación cuando el estado es pending_payment

-- backend/migrations/015_add_whatsapp_to_company_settings.sql

-- Descripción: Agregar campo de WhatsApp a configuración de empresa
-- Relacionado con: Sistema de contacto y pagos

-- ============================================
-- CAMBIOS
-- ============================================

-- Agregar campo de WhatsApp para contacto
ALTER TABLE company_settings
  ADD COLUMN contact_whatsapp VARCHAR(50) AFTER contact_phone;

-- ============================================
-- NOTAS
-- ============================================

-- Este campo se usará para mostrar el número de WhatsApp en correos y frontend
-- Formato recomendado: +56912345678 (con código de país)

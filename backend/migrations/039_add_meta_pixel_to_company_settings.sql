-- backend/migrations/039_add_meta_pixel_to_company_settings.sql

-- Descripción: Agregar campo para Meta Pixel (Facebook Pixel) ID
-- Relacionado con: Implementación de seguimiento de conversiones con Meta Pixel

-- ============================================
-- CAMBIOS
-- ============================================

ALTER TABLE company_settings 
ADD COLUMN meta_pixel_id VARCHAR(50) NULL AFTER x_url;

-- ============================================
-- NOTAS
-- ============================================

-- El Meta Pixel ID es un identificador de 15-16 dígitos proporcionado por Meta
-- Se usará para rastrear conversiones, eventos y comportamiento de usuarios
-- Eventos principales: PageView, ViewContent, AddToCart, InitiateCheckout, Purchase

-- backend/migrations/029_add_payment_link_to_products.sql

-- Descripción: Agregar campo payment_link a la tabla products
-- Relacionado con: Sistema de pago de productos

-- ============================================
-- CAMBIOS
-- ============================================

ALTER TABLE products 
ADD COLUMN payment_link VARCHAR(500) NULL AFTER price;

-- ============================================
-- NOTAS
-- ============================================

-- Este campo almacenará el link de pago (ej: Mercado Pago, Flow, etc.)
-- que se enviará por correo cuando un cliente solicite comprar el producto

-- ============================================
-- COMANDOS SQL PASO A PASO PARA EASYPANEL
-- Ejecutar UNO POR UNO si el script completo falla
-- ============================================

-- ============================================
-- PASO 1: Agregar columna price a bookings
-- ============================================

-- 1.1 Verificar si la columna existe
SELECT 
  COLUMN_NAME 
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'bookings'
  AND COLUMN_NAME = 'price';

-- Si NO aparece nada, ejecutar:
-- 1.2 Agregar columna
ALTER TABLE bookings 
ADD COLUMN price DECIMAL(10,2) DEFAULT 0.00 AFTER service_id;

-- 1.3 Actualizar precios desde services
UPDATE bookings b
INNER JOIN services s ON b.service_id = s.id
SET b.price = s.price;

-- 1.4 Verificar que se agregó
SELECT id, service_id, price, date_time 
FROM bookings 
LIMIT 5;

-- ============================================
-- PASO 2: Crear tabla company_settings
-- ============================================

-- 2.1 Verificar si existe
SHOW TABLES LIKE 'company_settings';

-- Si NO existe, ejecutar:
-- 2.2 Crear tabla
CREATE TABLE company_settings (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_name VARCHAR(255) NOT NULL DEFAULT 'Clínica de Belleza',
  company_description TEXT,
  logo_url VARCHAR(500),
  contact_address VARCHAR(500),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  facebook_url VARCHAR(500),
  instagram_url VARCHAR(500),
  tiktok_url VARCHAR(500),
  x_url VARCHAR(500),
  dashboard_primary_color VARCHAR(7) DEFAULT '#1976d2',
  dashboard_secondary_color VARCHAR(7) DEFAULT '#dc004e',
  dashboard_background_color VARCHAR(7) DEFAULT '#f5f5f5',
  dashboard_text_color VARCHAR(7) DEFAULT '#000000',
  frontend_primary_color VARCHAR(7) DEFAULT '#1976d2',
  frontend_secondary_color VARCHAR(7) DEFAULT '#dc004e',
  frontend_background_color VARCHAR(7) DEFAULT '#ffffff',
  frontend_text_color VARCHAR(7) DEFAULT '#000000',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2.3 Insertar datos por defecto
INSERT INTO company_settings (
  id,
  company_name,
  company_description,
  contact_phone,
  contact_email
) VALUES (
  UUID(),
  'Clínica de Belleza',
  'Centro de belleza y bienestar dedicado a realzar tu belleza natural',
  '+56912345678',
  'contacto@clinica.cl'
);

-- 2.4 Verificar
SELECT * FROM company_settings;

-- ============================================
-- PASO 3: Crear tabla banners
-- ============================================

-- 3.1 Verificar si existe
SHOW TABLES LIKE 'banners';

-- Si NO existe, ejecutar:
-- 3.2 Crear tabla
CREATE TABLE banners (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  link VARCHAR(500),
  image_url VARCHAR(500),
  `order` INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3.3 Crear índices
CREATE INDEX idx_active ON banners(active);
CREATE INDEX idx_order ON banners(`order`);

-- 3.4 Insertar banner de ejemplo
INSERT INTO banners (id, title, description, `order`, active)
VALUES (
  UUID(),
  'Bienvenido a Clínica de Belleza',
  'Descubre nuestros servicios de belleza y bienestar',
  0,
  TRUE
);

-- 3.5 Verificar
SELECT * FROM banners;

-- ============================================
-- PASO 4: Crear tabla featured_images
-- ============================================

-- 4.1 Verificar si existe
SHOW TABLES LIKE 'featured_images';

-- Si NO existe, ejecutar:
-- 4.2 Crear tabla
CREATE TABLE featured_images (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  slot INT NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4.3 Crear índices
CREATE INDEX idx_slot ON featured_images(slot);
CREATE INDEX idx_active ON featured_images(active);

-- 4.4 Insertar slots por defecto
INSERT INTO featured_images (id, slot, title, active)
VALUES 
  (UUID(), 1, 'Imagen Destacada 1', TRUE);

INSERT INTO featured_images (id, slot, title, active)
VALUES 
  (UUID(), 2, 'Imagen Destacada 2', TRUE);

INSERT INTO featured_images (id, slot, title, active)
VALUES 
  (UUID(), 3, 'Imagen Destacada 3', TRUE);

-- 4.5 Verificar
SELECT * FROM featured_images ORDER BY slot;

-- ============================================
-- VERIFICACIÓN FINAL COMPLETA
-- ============================================

-- Ver todas las tablas
SHOW TABLES;

-- Ver estructura de bookings
DESCRIBE bookings;

-- Contar registros en todas las tablas
SELECT 'clients' as tabla, COUNT(*) as registros FROM clients
UNION ALL
SELECT 'services', COUNT(*) FROM services
UNION ALL
SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL
SELECT 'company_settings', COUNT(*) FROM company_settings
UNION ALL
SELECT 'banners', COUNT(*) FROM banners
UNION ALL
SELECT 'featured_images', COUNT(*) FROM featured_images;

-- Verificar que bookings tiene precios
SELECT 
  b.id,
  s.name as servicio,
  b.price as precio_booking,
  s.price as precio_servicio,
  b.date_time
FROM bookings b
LEFT JOIN services s ON b.service_id = s.id
LIMIT 10;

-- ============================================
-- COMANDOS DE LIMPIEZA (Solo si necesitas empezar de nuevo)
-- ============================================

-- ⚠️ CUIDADO: Estos comandos ELIMINAN datos
-- Solo usar si algo salió mal y necesitas reintentar

-- DROP TABLE IF EXISTS company_settings;
-- DROP TABLE IF EXISTS banners;
-- DROP TABLE IF EXISTS featured_images;
-- ALTER TABLE bookings DROP COLUMN IF EXISTS price;

-- ============================================
-- FIN
-- ============================================

SELECT '✅ Todos los pasos completados' as status;

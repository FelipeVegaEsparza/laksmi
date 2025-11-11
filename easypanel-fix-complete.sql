-- ============================================
-- SCRIPT COMPLETO DE CORRECCIÓN PARA EASYPANEL
-- Ejecutar en la base de datos MySQL de producción
-- ============================================

-- 1. AGREGAR COLUMNA PRICE A BOOKINGS
-- Esta columna falta y está causando el error principal

-- Verificar si la columna existe antes de agregarla
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'bookings' 
  AND COLUMN_NAME = 'price';

-- Agregar columna solo si no existe
SET @query = IF(@col_exists = 0,
  'ALTER TABLE bookings ADD COLUMN price DECIMAL(10,2) DEFAULT 0.00 AFTER service_id',
  'SELECT "Columna price ya existe" as info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Actualizar precios existentes desde services
UPDATE bookings b
INNER JOIN services s ON b.service_id = s.id
SET b.price = s.price
WHERE b.price = 0 OR b.price IS NULL;

-- 2. CREAR TABLA COMPANY_SETTINGS
CREATE TABLE IF NOT EXISTS company_settings (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_name VARCHAR(255) NOT NULL DEFAULT 'Clínica de Belleza',
  company_description TEXT,
  logo_url VARCHAR(500),
  
  -- Datos de contacto
  contact_address VARCHAR(500),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  
  -- Redes sociales
  facebook_url VARCHAR(500),
  instagram_url VARCHAR(500),
  tiktok_url VARCHAR(500),
  x_url VARCHAR(500),
  
  -- Colores del Dashboard
  dashboard_primary_color VARCHAR(7) DEFAULT '#1976d2',
  dashboard_secondary_color VARCHAR(7) DEFAULT '#dc004e',
  dashboard_background_color VARCHAR(7) DEFAULT '#f5f5f5',
  dashboard_text_color VARCHAR(7) DEFAULT '#000000',
  
  -- Colores del Frontend
  frontend_primary_color VARCHAR(7) DEFAULT '#1976d2',
  frontend_secondary_color VARCHAR(7) DEFAULT '#dc004e',
  frontend_background_color VARCHAR(7) DEFAULT '#ffffff',
  frontend_text_color VARCHAR(7) DEFAULT '#000000',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar configuración por defecto si no existe
INSERT INTO company_settings (
  id,
  company_name,
  company_description,
  contact_phone,
  contact_email
)
SELECT 
  UUID(),
  'Clínica de Belleza',
  'Centro de belleza y bienestar dedicado a realzar tu belleza natural',
  '+56912345678',
  'contacto@clinica.cl'
WHERE NOT EXISTS (SELECT 1 FROM company_settings LIMIT 1);

-- 3. CREAR TABLA BANNERS
CREATE TABLE IF NOT EXISTS banners (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  link VARCHAR(500),
  image_url VARCHAR(500),
  `order` INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_active (active),
  INDEX idx_order (`order`)
);

-- Insertar banners de ejemplo si no existen
INSERT INTO banners (id, title, description, `order`, active)
SELECT UUID(), 'Bienvenido a Clínica de Belleza', 'Descubre nuestros servicios de belleza', 0, TRUE
WHERE NOT EXISTS (SELECT 1 FROM banners LIMIT 1);

-- 4. CREAR TABLA FEATURED_IMAGES
CREATE TABLE IF NOT EXISTS featured_images (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  slot INT NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_slot (slot),
  INDEX idx_active (active)
);

-- Insertar slots por defecto (3 imágenes destacadas)
INSERT INTO featured_images (id, slot, title, active)
SELECT UUID(), 1, 'Imagen Destacada 1', TRUE
WHERE NOT EXISTS (SELECT 1 FROM featured_images WHERE slot = 1);

INSERT INTO featured_images (id, slot, title, active)
SELECT UUID(), 2, 'Imagen Destacada 2', TRUE
WHERE NOT EXISTS (SELECT 1 FROM featured_images WHERE slot = 2);

INSERT INTO featured_images (id, slot, title, active)
SELECT UUID(), 3, 'Imagen Destacada 3', TRUE
WHERE NOT EXISTS (SELECT 1 FROM featured_images WHERE slot = 3);

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

-- Mostrar todas las tablas creadas/actualizadas
SELECT 
  TABLE_NAME,
  TABLE_ROWS,
  CREATE_TIME,
  UPDATE_TIME
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME IN (
    'bookings',
    'company_settings',
    'banners',
    'featured_images'
  )
ORDER BY TABLE_NAME;

-- Verificar columnas de bookings
SELECT 
  COLUMN_NAME,
  DATA_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'bookings'
  AND COLUMN_NAME IN ('price', 'service_id', 'client_id')
ORDER BY ORDINAL_POSITION;

-- Contar registros en las nuevas tablas
SELECT 'company_settings' as tabla, COUNT(*) as registros FROM company_settings
UNION ALL
SELECT 'banners' as tabla, COUNT(*) as registros FROM banners
UNION ALL
SELECT 'featured_images' as tabla, COUNT(*) as registros FROM featured_images;

SELECT '✅ Script ejecutado correctamente' as status;

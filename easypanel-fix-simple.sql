-- ============================================
-- SCRIPT SIMPLE DE CORRECCIÓN PARA EASYPANEL
-- Versión simplificada sin condicionales complejos
-- ============================================

-- IMPORTANTE: Si alguna tabla/columna ya existe, MySQL mostrará un warning
-- pero continuará con el resto del script. Esto es NORMAL y seguro.

-- ============================================
-- 1. AGREGAR COLUMNA PRICE A BOOKINGS
-- ============================================

-- Opción A: Si la columna NO existe (ejecutar primero)
ALTER TABLE bookings 
ADD COLUMN price DECIMAL(10,2) DEFAULT 0.00 AFTER service_id;

-- Si da error "Duplicate column name 'price'", ignorar y continuar

-- Actualizar precios desde services
UPDATE bookings b
INNER JOIN services s ON b.service_id = s.id
SET b.price = s.price
WHERE b.price = 0 OR b.price IS NULL;

-- ============================================
-- 2. CREAR TABLA COMPANY_SETTINGS
-- ============================================

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

-- Insertar configuración por defecto
INSERT IGNORE INTO company_settings (
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

-- ============================================
-- 3. CREAR TABLA BANNERS
-- ============================================

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

-- Insertar banner de ejemplo
INSERT IGNORE INTO banners (id, title, description, `order`, active)
VALUES (
  UUID(),
  'Bienvenido a Clínica de Belleza',
  'Descubre nuestros servicios de belleza y bienestar',
  0,
  TRUE
);

-- ============================================
-- 4. CREAR TABLA FEATURED_IMAGES
-- ============================================

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
INSERT IGNORE INTO featured_images (id, slot, title, active)
VALUES 
  (UUID(), 1, 'Imagen Destacada 1', TRUE),
  (UUID(), 2, 'Imagen Destacada 2', TRUE),
  (UUID(), 3, 'Imagen Destacada 3', TRUE);

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

SELECT '✅ Script ejecutado' as status;

-- Ver tablas creadas
SELECT 
  TABLE_NAME,
  TABLE_ROWS
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME IN ('bookings', 'company_settings', 'banners', 'featured_images')
ORDER BY TABLE_NAME;

-- Verificar columna price en bookings
SELECT 
  COLUMN_NAME,
  DATA_TYPE,
  COLUMN_DEFAULT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'bookings'
  AND COLUMN_NAME = 'price';

-- Contar registros
SELECT 'company_settings' as tabla, COUNT(*) as registros FROM company_settings
UNION ALL
SELECT 'banners', COUNT(*) FROM banners
UNION ALL
SELECT 'featured_images', COUNT(*) FROM featured_images;

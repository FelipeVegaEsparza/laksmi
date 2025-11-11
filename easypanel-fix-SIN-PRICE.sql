-- SCRIPT ALTERNATIVO - Si la columna price ya existe, usa este

-- 1. Actualizar precios desde services (por si ya existe la columna)
UPDATE bookings b
INNER JOIN services s ON b.service_id = s.id
SET b.price = s.price
WHERE b.price = 0 OR b.price IS NULL;

-- 2. Crear tabla company_settings
CREATE TABLE IF NOT EXISTS company_settings (
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

-- 3. Insertar configuración por defecto
INSERT IGNORE INTO company_settings (id, company_name, company_description, contact_phone, contact_email)
VALUES (UUID(), 'Clínica de Belleza', 'Centro de belleza y bienestar dedicado a realzar tu belleza natural', '+56912345678', 'contacto@clinica.cl');

-- 4. Crear tabla banners
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

-- 5. Insertar banner de ejemplo
INSERT IGNORE INTO banners (id, title, description, `order`, active)
VALUES (UUID(), 'Bienvenido a Clínica de Belleza', 'Descubre nuestros servicios de belleza y bienestar', 0, TRUE);

-- 6. Crear tabla featured_images
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

-- 7. Insertar slots por defecto
INSERT IGNORE INTO featured_images (id, slot, title, active) VALUES (UUID(), 1, 'Imagen Destacada 1', TRUE);
INSERT IGNORE INTO featured_images (id, slot, title, active) VALUES (UUID(), 2, 'Imagen Destacada 2', TRUE);
INSERT IGNORE INTO featured_images (id, slot, title, active) VALUES (UUID(), 3, 'Imagen Destacada 3', TRUE);

-- 8. Verificación
SELECT '✅ Script ejecutado correctamente' as status;

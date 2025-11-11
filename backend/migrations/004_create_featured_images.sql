-- Crear tabla de imágenes destacadas para el frontend

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

-- Crear tabla de configuración de la empresa

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

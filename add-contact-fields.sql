-- Agregar campos de contacto a la tabla company_settings
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS contact_address VARCHAR(500),
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);

-- Verificar que las columnas se agregaron correctamente
DESCRIBE company_settings;

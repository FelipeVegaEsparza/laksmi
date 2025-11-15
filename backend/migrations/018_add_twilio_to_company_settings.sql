-- Migración: Agregar configuración de Twilio a company_settings
-- Descripción: Agregar campos para almacenar la configuración de Twilio WhatsApp

ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS twilio_account_sid VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS twilio_auth_token VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS twilio_phone_number VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS twilio_webhook_url VARCHAR(500) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS twilio_validate_signatures BOOLEAN DEFAULT TRUE;

-- Nota: Los campos son opcionales (NULL) para no romper instalaciones existentes
-- Usamos IF NOT EXISTS para evitar errores si las columnas ya existen

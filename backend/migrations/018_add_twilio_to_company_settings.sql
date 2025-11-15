-- Migración: Agregar configuración de Twilio a company_settings
-- Descripción: Agregar campos para almacenar la configuración de Twilio WhatsApp

-- Agregar columnas de Twilio (cada una en su propio statement para mejor manejo de errores)
ALTER TABLE company_settings ADD COLUMN twilio_account_sid VARCHAR(255) DEFAULT NULL;
ALTER TABLE company_settings ADD COLUMN twilio_auth_token VARCHAR(255) DEFAULT NULL;
ALTER TABLE company_settings ADD COLUMN twilio_phone_number VARCHAR(50) DEFAULT NULL;
ALTER TABLE company_settings ADD COLUMN twilio_webhook_url VARCHAR(500) DEFAULT NULL;
ALTER TABLE company_settings ADD COLUMN twilio_validate_signatures BOOLEAN DEFAULT TRUE;

-- Nota: Los campos son opcionales (NULL) para no romper instalaciones existentes

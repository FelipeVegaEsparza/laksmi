-- backend/migrations/010_create_professionals_table.sql

-- Descripción: Crear tabla de profesionales para el sistema de reservas
-- Relacionado con: Sistema de reservas y disponibilidad

-- ============================================
-- CAMBIOS
-- ============================================

CREATE TABLE IF NOT EXISTS professionals (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL UNIQUE,
  specialties JSON NOT NULL DEFAULT ('[]'),
  schedule JSON NOT NULL DEFAULT ('{}'),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_professionals_name (name),
  INDEX idx_professionals_active (is_active)
);

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Insertar un profesional por defecto para que el sistema funcione
INSERT INTO professionals (name, specialties, schedule, is_active) VALUES 
(
  'Profesional General',
  '[]',
  '{
    "monday": {"isWorking": true, "shifts": [{"startTime": "09:00", "endTime": "18:00"}]},
    "tuesday": {"isWorking": true, "shifts": [{"startTime": "09:00", "endTime": "18:00"}]},
    "wednesday": {"isWorking": true, "shifts": [{"startTime": "09:00", "endTime": "18:00"}]},
    "thursday": {"isWorking": true, "shifts": [{"startTime": "09:00", "endTime": "18:00"}]},
    "friday": {"isWorking": true, "shifts": [{"startTime": "09:00", "endTime": "18:00"}]},
    "saturday": {"isWorking": true, "shifts": [{"startTime": "09:00", "endTime": "16:00"}]},
    "sunday": {"isWorking": false, "shifts": []}
  }',
  TRUE
);

-- ============================================
-- NOTAS
-- ============================================

-- Esta tabla almacena los profesionales que pueden realizar servicios
-- specialties: JSON array con IDs de servicios que puede realizar
-- schedule: JSON object con horarios de trabajo por día de la semana
-- El profesional por defecto puede realizar cualquier servicio
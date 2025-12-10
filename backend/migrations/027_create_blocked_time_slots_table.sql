-- backend/migrations/027_create_blocked_time_slots_table.sql

-- Descripción: Crear tabla para bloques horarios bloqueados
-- Relacionado con: Sistema de gestión de disponibilidad de citas

-- ============================================
-- CAMBIOS
-- ============================================

CREATE TABLE IF NOT EXISTS blocked_time_slots (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  reason VARCHAR(255),
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_time_range (start_time, end_time),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- NOTAS
-- ============================================

-- Esta tabla permite bloquear bloques horarios específicos
-- Los bloques bloqueados no aparecerán como disponibles en el frontend
-- Se pueden usar para vacaciones, mantenimiento, eventos especiales, etc.

-- backend/migrations/028_fix_blocked_time_slots_uuid.sql

-- Descripción: Corregir generación de UUID en blocked_time_slots
-- Relacionado con: Fix para persistencia de bloques horarios

-- ============================================
-- CAMBIOS
-- ============================================

-- Eliminar la tabla existente y recrearla con UUID correcto
DROP TABLE IF EXISTS blocked_time_slots;

CREATE TABLE blocked_time_slots (
  id CHAR(36) PRIMARY KEY,
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

-- Cambiamos de VARCHAR(36) con DEFAULT (UUID()) a CHAR(36) sin default
-- El UUID se generará en el código de la aplicación usando uuid v4
-- Esto es más compatible y confiable que depender de MySQL

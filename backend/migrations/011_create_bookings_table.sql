-- backend/migrations/011_create_bookings_table.sql

-- Descripción: Crear tabla de reservas/citas para el sistema de bookings
-- Relacionado con: Sistema de reservas y gestión de citas

-- ============================================
-- CAMBIOS
-- ============================================

CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  client_id VARCHAR(36) NOT NULL,
  service_id VARCHAR(36) NOT NULL,
  professional_id VARCHAR(36) NULL,
  date_time DATETIME NOT NULL,
  duration INT NOT NULL DEFAULT 60,
  status ENUM('confirmed', 'cancelled', 'completed', 'no_show') DEFAULT 'confirmed',
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_bookings_client (client_id),
  INDEX idx_bookings_service (service_id),
  INDEX idx_bookings_professional (professional_id),
  INDEX idx_bookings_datetime (date_time),
  INDEX idx_bookings_status (status),
  INDEX idx_bookings_date_status (date_time, status),
  
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE SET NULL
);

-- ============================================
-- NOTAS
-- ============================================

-- Esta tabla almacena todas las reservas/citas del sistema
-- client_id: Referencia al cliente que hace la reserva
-- service_id: Referencia al servicio reservado
-- professional_id: Referencia al profesional asignado (puede ser NULL)
-- date_time: Fecha y hora de la cita
-- duration: Duración en minutos
-- status: Estado de la cita (confirmada, cancelada, completada, no show)
-- notes: Notas adicionales sobre la cita
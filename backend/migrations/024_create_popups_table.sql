-- backend/migrations/016_create_popups_table.sql

-- Descripción: Crear tabla para gestionar popups promocionales
-- Relacionado con: Sistema de marketing y promociones

-- ============================================
-- CAMBIOS
-- ============================================

CREATE TABLE IF NOT EXISTS popups (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  link_url VARCHAR(500) NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active_order (is_active, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- NOTAS
-- ============================================

-- title: Título descriptivo del popup (para identificación en dashboard)
-- image_url: URL de la imagen del popup
-- link_url: URL a la que redirige al hacer clic
-- display_order: Orden de visualización en el carrusel (menor = primero)
-- is_active: Si el popup está activo o no

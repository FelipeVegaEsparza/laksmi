-- backend/migrations/023_create_legal_pages_table.sql

-- Descripción: Crear tabla para almacenar contenido de páginas legales
-- Relacionado con: Gestión de páginas legales desde dashboard

-- ============================================
-- CREAR TABLA legal_pages
-- ============================================

CREATE TABLE IF NOT EXISTS legal_pages (
  id VARCHAR(36) PRIMARY KEY,
  page_type VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_page_type (page_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INSERTAR DATOS INICIALES
-- ============================================

INSERT INTO legal_pages (id, page_type, title, content) VALUES
(UUID(), 'terms', 'Términos y Condiciones', '<h2>Términos y Condiciones</h2><p>Contenido de términos y condiciones. Por favor, edita este contenido desde el dashboard.</p>'),
(UUID(), 'consent', 'Consentimientos Informados', '<h2>Consentimientos Informados</h2><p>Contenido de consentimientos informados. Por favor, edita este contenido desde el dashboard.</p>'),
(UUID(), 'privacy', 'Política de Privacidad', '<h2>Política de Privacidad</h2><p>Contenido de política de privacidad. Por favor, edita este contenido desde el dashboard.</p>');

-- ============================================
-- NOTAS
-- ============================================

-- page_type valores permitidos: 'terms', 'consent', 'privacy'
-- content almacena HTML generado por el editor de texto enriquecido
-- UNIQUE en page_type asegura que solo haya una entrada por tipo de página

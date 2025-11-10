-- Migración: Base de Conocimientos para Chatbot
-- Descripción: Tablas para almacenar información que el chatbot puede usar para responder preguntas

-- Tabla de categorías de conocimiento
CREATE TABLE IF NOT EXISTS knowledge_categories (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active (is_active),
  INDEX idx_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de artículos de conocimiento
CREATE TABLE IF NOT EXISTS knowledge_articles (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  category_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  summary VARCHAR(500),
  keywords TEXT, -- JSON array de palabras clave para búsqueda
  tags TEXT, -- JSON array de tags
  related_services TEXT, -- JSON array de IDs de servicios relacionados
  related_products TEXT, -- JSON array de IDs de productos relacionados
  view_count INT DEFAULT 0,
  helpful_count INT DEFAULT 0,
  not_helpful_count INT DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  published_at TIMESTAMP NULL,
  created_by VARCHAR(36),
  updated_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES knowledge_categories(id) ON DELETE CASCADE,
  INDEX idx_category (category_id),
  INDEX idx_published (is_published),
  INDEX idx_views (view_count),
  FULLTEXT INDEX idx_search (title, content, summary, keywords)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de preguntas frecuentes (FAQ)
CREATE TABLE IF NOT EXISTS knowledge_faqs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  category_id CHAR(36) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT, -- JSON array de palabras clave
  display_order INT DEFAULT 0,
  view_count INT DEFAULT 0,
  helpful_count INT DEFAULT 0,
  not_helpful_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES knowledge_categories(id) ON DELETE CASCADE,
  INDEX idx_category (category_id),
  INDEX idx_active (is_active),
  INDEX idx_order (display_order),
  FULLTEXT INDEX idx_search (question, answer, keywords)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de tecnologías y equipos
CREATE TABLE IF NOT EXISTS knowledge_technologies (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  benefits TEXT, -- JSON array de beneficios
  applications TEXT, -- JSON array de aplicaciones
  related_services TEXT, -- JSON array de IDs de servicios
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active (is_active),
  FULLTEXT INDEX idx_search (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de ingredientes y componentes
CREATE TABLE IF NOT EXISTS knowledge_ingredients (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  benefits TEXT, -- JSON array de beneficios
  precautions TEXT, -- Precauciones y contraindicaciones
  related_products TEXT, -- JSON array de IDs de productos
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active (is_active),
  FULLTEXT INDEX idx_search (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de búsquedas del chatbot (para analytics)
CREATE TABLE IF NOT EXISTS knowledge_searches (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  conversation_id VARCHAR(36),
  query TEXT NOT NULL,
  results_found INT DEFAULT 0,
  result_ids TEXT, -- JSON array de IDs de resultados
  was_helpful BOOLEAN NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_conversation (conversation_id),
  INDEX idx_created (created_at),
  FULLTEXT INDEX idx_query (query)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar categorías iniciales
INSERT INTO knowledge_categories (name, description, icon, display_order) VALUES
('Servicios', 'Información sobre nuestros servicios de belleza', 'spa', 1),
('Productos', 'Detalles sobre productos que utilizamos y vendemos', 'shopping_bag', 2),
('Tecnologías', 'Equipos y tecnologías que utilizamos', 'settings', 3),
('Ingredientes', 'Información sobre ingredientes y componentes', 'science', 4),
('Cuidados', 'Cuidados pre y post tratamiento', 'favorite', 5),
('Políticas', 'Políticas de la clínica', 'policy', 6);

-- Insertar FAQs iniciales
INSERT INTO knowledge_faqs (category_id, question, answer, keywords, display_order) VALUES
(
  (SELECT id FROM knowledge_categories WHERE name = 'Servicios' LIMIT 1),
  '¿Cuánto dura un tratamiento facial?',
  'La duración de un tratamiento facial varía según el tipo de servicio. Un facial básico dura aproximadamente 60 minutos, mientras que tratamientos más especializados como el facial con microdermoabrasión pueden durar hasta 90 minutos. Te recomendamos consultar la duración específica al momento de agendar tu cita.',
  '["duracion", "tiempo", "facial", "tratamiento", "cuanto dura"]',
  1
),
(
  (SELECT id FROM knowledge_categories WHERE name = 'Servicios' LIMIT 1),
  '¿Cada cuánto debo hacerme un tratamiento de manicure?',
  'Para mantener tus uñas saludables y hermosas, recomendamos un manicure cada 2-3 semanas. Si optas por manicure con gel, puede durar hasta 3-4 semanas. El cuidado regular ayuda a prevenir problemas y mantener la salud de tus uñas.',
  '["frecuencia", "manicure", "cada cuanto", "regularidad", "mantenimiento"]',
  2
),
(
  (SELECT id FROM knowledge_categories WHERE name = 'Productos' LIMIT 1),
  '¿Qué productos utilizan en los tratamientos?',
  'Utilizamos productos de alta calidad de marcas reconocidas internacionalmente. Todos nuestros productos son dermatológicamente probados y seleccionados específicamente para cada tipo de piel. Incluyen ingredientes naturales y activos que garantizan resultados efectivos y seguros.',
  '["productos", "marcas", "calidad", "que usan", "ingredientes"]',
  1
),
(
  (SELECT id FROM knowledge_categories WHERE name = 'Políticas' LIMIT 1),
  '¿Cuál es la política de cancelación?',
  'Puedes cancelar o reprogramar tu cita con al menos 24 horas de anticipación sin ningún cargo. Cancelaciones con menos de 24 horas de anticipación o no presentarse a la cita pueden estar sujetas a un cargo del 50% del valor del servicio.',
  '["cancelacion", "reprogramar", "politica", "cambiar cita", "no asistir"]',
  1
),
(
  (SELECT id FROM knowledge_categories WHERE name = 'Cuidados' LIMIT 1),
  '¿Qué cuidados debo tener después de un tratamiento facial?',
  'Después de un tratamiento facial: 1) Evita maquillaje por 24 horas, 2) No expongas tu piel al sol directo, 3) Usa protector solar SPF 50+, 4) Mantén tu piel hidratada, 5) Evita ejercicio intenso por 24 horas, 6) No uses productos exfoliantes por 3 días.',
  '["cuidados", "despues", "post tratamiento", "recomendaciones", "facial"]',
  1
);

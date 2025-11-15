-- Migración: Sistema de Escalaciones
-- Descripción: Tabla para registrar escalaciones de conversaciones que requieren atención humana

-- ============================================
-- TABLA DE ESCALACIONES
-- ============================================

CREATE TABLE IF NOT EXISTS escalations (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  escalation_code VARCHAR(50) UNIQUE NOT NULL, -- Código único tipo ESC_XXX_XXX
  conversation_id VARCHAR(36) NOT NULL,
  client_id VARCHAR(36) NOT NULL,
  
  -- Información de la escalación
  reason ENUM(
    'low_confidence',
    'failed_attempts', 
    'complaint',
    'complex_request',
    'technical_issue',
    'payment_issue',
    'client_request'
  ) NOT NULL,
  priority ENUM('urgent', 'high', 'medium', 'low') NOT NULL DEFAULT 'medium',
  status ENUM('pending', 'assigned', 'in_progress', 'resolved', 'cancelled') NOT NULL DEFAULT 'pending',
  
  -- Detalles
  summary TEXT NOT NULL,
  client_message TEXT, -- Último mensaje del cliente que causó la escalación
  ai_response TEXT, -- Última respuesta del bot
  confidence_score DECIMAL(3,2), -- Score de confianza del bot (0.00 - 1.00)
  
  -- Asignación
  assigned_to VARCHAR(36), -- ID del agente humano asignado
  assigned_at TIMESTAMP NULL,
  
  -- Resolución
  resolved_by VARCHAR(36), -- ID del agente que resolvió
  resolved_at TIMESTAMP NULL,
  resolution_notes TEXT,
  resolution_time_minutes INT, -- Tiempo en minutos desde creación hasta resolución
  
  -- Metadata
  metadata JSON, -- Información adicional (acciones recomendadas, contexto, etc.)
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
  
  -- Índices para búsquedas rápidas
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_reason (reason),
  INDEX idx_conversation (conversation_id),
  INDEX idx_client (client_id),
  INDEX idx_assigned_to (assigned_to),
  INDEX idx_created_at (created_at),
  INDEX idx_status_priority (status, priority), -- Índice compuesto para dashboard
  INDEX idx_pending_urgent (status, priority, created_at) -- Para alertas urgentes
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- TABLA DE NOTIFICACIONES DE ESCALACIÓN
-- ============================================

CREATE TABLE IF NOT EXISTS escalation_notifications (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  escalation_id VARCHAR(36) NOT NULL,
  
  -- Información de la notificación
  notification_type ENUM('email', 'sms', 'push', 'dashboard') NOT NULL,
  recipient_id VARCHAR(36) NOT NULL, -- ID del usuario que recibe la notificación
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(20),
  
  -- Estado
  status ENUM('pending', 'sent', 'delivered', 'failed', 'read') NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP NULL,
  delivered_at TIMESTAMP NULL,
  read_at TIMESTAMP NULL,
  failed_reason TEXT,
  
  -- Contenido
  subject VARCHAR(255),
  message TEXT,
  
  -- Metadata
  metadata JSON,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (escalation_id) REFERENCES escalations(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Índices
  INDEX idx_escalation (escalation_id),
  INDEX idx_recipient (recipient_id),
  INDEX idx_status (status),
  INDEX idx_type (notification_type),
  INDEX idx_pending (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- TABLA DE HISTORIAL DE ESCALACIONES
-- ============================================

CREATE TABLE IF NOT EXISTS escalation_history (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  escalation_id VARCHAR(36) NOT NULL,
  
  -- Cambio registrado
  action ENUM(
    'created',
    'assigned',
    'status_changed',
    'priority_changed',
    'note_added',
    'resolved',
    'cancelled',
    'reopened'
  ) NOT NULL,
  
  -- Detalles del cambio
  previous_value VARCHAR(255),
  new_value VARCHAR(255),
  notes TEXT,
  
  -- Quién hizo el cambio
  changed_by VARCHAR(36), -- ID del usuario (NULL si fue automático)
  changed_by_type ENUM('user', 'system', 'ai') NOT NULL DEFAULT 'system',
  
  -- Timestamp
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (escalation_id) REFERENCES escalations(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,
  
  -- Índices
  INDEX idx_escalation (escalation_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- VISTA PARA DASHBOARD DE ESCALACIONES
-- ============================================

CREATE OR REPLACE VIEW escalations_dashboard AS
SELECT 
  e.id,
  e.escalation_code,
  e.conversation_id,
  e.client_id,
  c.name AS client_name,
  c.phone AS client_phone,
  e.reason,
  e.priority,
  e.status,
  e.summary,
  e.confidence_score,
  e.assigned_to,
  u.name AS assigned_to_name,
  e.created_at,
  e.assigned_at,
  e.resolved_at,
  e.resolution_time_minutes,
  TIMESTAMPDIFF(MINUTE, e.created_at, COALESCE(e.resolved_at, NOW())) AS age_minutes,
  CASE 
    WHEN e.status = 'pending' AND e.priority = 'urgent' AND TIMESTAMPDIFF(MINUTE, e.created_at, NOW()) > 15 THEN 'overdue'
    WHEN e.status = 'pending' AND e.priority = 'high' AND TIMESTAMPDIFF(MINUTE, e.created_at, NOW()) > 30 THEN 'overdue'
    WHEN e.status = 'pending' AND e.priority = 'medium' AND TIMESTAMPDIFF(MINUTE, e.created_at, NOW()) > 60 THEN 'overdue'
    WHEN e.status = 'pending' THEN 'on_time'
    ELSE 'completed'
  END AS sla_status,
  (SELECT COUNT(*) FROM escalation_notifications WHERE escalation_id = e.id AND status = 'sent') AS notifications_sent,
  (SELECT COUNT(*) FROM escalation_history WHERE escalation_id = e.id) AS history_count
FROM escalations e
LEFT JOIN clients c ON e.client_id = c.id
LEFT JOIN users u ON e.assigned_to = u.id;

-- ============================================
-- NOTAS
-- ============================================

-- Esta migración crea el sistema completo de escalaciones con:
-- 1. Tabla principal de escalaciones con todos los campos necesarios
-- 2. Tabla de notificaciones para tracking de alertas enviadas
-- 3. Tabla de historial para auditoría completa
-- 4. Vista optimizada para el dashboard
-- 5. Índices optimizados para consultas rápidas

-- El sistema permite:
-- - Crear escalaciones automáticas desde el bot
-- - Asignar agentes humanos
-- - Tracking de SLA (Service Level Agreement)
-- - Historial completo de cambios
-- - Notificaciones multi-canal
-- - Métricas y analytics

-- backend/migrations/036_make_escalations_summary_nullable.sql

-- Descripción: Hacer que el campo summary de escalations sea nullable
-- Relacionado con: Fix para permitir escalaciones sin summary

-- ============================================
-- CAMBIOS
-- ============================================

-- Modificar columna summary para permitir NULL
ALTER TABLE escalations
  MODIFY COLUMN summary TEXT NULL;

-- ============================================
-- NOTAS
-- ============================================

-- Esto permite crear escalaciones sin proporcionar un summary
-- El summary se puede agregar después cuando se tenga más información

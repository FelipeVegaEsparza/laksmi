-- backend/migrations/041_add_secretaria_role.sql

-- Descripción: Agregar rol 'secretaria' al campo role de la tabla users
-- Relacionado con: Sistema de gestión de usuarios

-- ============================================
-- CAMBIOS
-- ============================================

-- Modificar el ENUM del campo role para incluir 'secretaria'
ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'manager', 'staff', 'secretaria') NOT NULL DEFAULT 'staff';

-- ============================================
-- NOTAS
-- ============================================

-- El rol 'secretaria' tendrá acceso limitado solo a:
-- - Citas (bookings)
-- - Conversaciones (conversations)

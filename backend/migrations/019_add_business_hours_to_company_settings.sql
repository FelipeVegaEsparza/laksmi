-- backend/migrations/019_add_business_hours_to_company_settings.sql

-- Descripción: Agregar horarios de apertura, cierre y colación del local
-- Relacionado con: Sistema de reservas basado en horarios del local

-- ============================================
-- CAMBIOS
-- ============================================

ALTER TABLE company_settings 
ADD COLUMN business_hours JSON DEFAULT NULL COMMENT 'Horarios de apertura, cierre y colación por día de la semana';

-- ============================================
-- ESTRUCTURA DEL JSON business_hours
-- ============================================
-- {
--   "monday": {
--     "isOpen": true,
--     "openTime": "09:00",
--     "closeTime": "20:00",
--     "lunchStart": "13:00",
--     "lunchEnd": "14:00"
--   },
--   "tuesday": { ... },
--   "wednesday": { ... },
--   "thursday": { ... },
--   "friday": { ... },
--   "saturday": { ... },
--   "sunday": {
--     "isOpen": false,
--     "openTime": null,
--     "closeTime": null,
--     "lunchStart": null,
--     "lunchEnd": null
--   }
-- }

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Actualizar solo si business_hours es NULL (no sobrescribir configuración existente)
UPDATE company_settings 
SET business_hours = JSON_OBJECT(
  'monday', JSON_OBJECT(
    'isOpen', true,
    'openTime', '09:00',
    'closeTime', '20:00',
    'lunchStart', '13:00',
    'lunchEnd', '14:00'
  ),
  'tuesday', JSON_OBJECT(
    'isOpen', true,
    'openTime', '09:00',
    'closeTime', '20:00',
    'lunchStart', '13:00',
    'lunchEnd', '14:00'
  ),
  'wednesday', JSON_OBJECT(
    'isOpen', true,
    'openTime', '09:00',
    'closeTime', '20:00',
    'lunchStart', '13:00',
    'lunchEnd', '14:00'
  ),
  'thursday', JSON_OBJECT(
    'isOpen', true,
    'openTime', '09:00',
    'closeTime', '20:00',
    'lunchStart', '13:00',
    'lunchEnd', '14:00'
  ),
  'friday', JSON_OBJECT(
    'isOpen', true,
    'openTime', '09:00',
    'closeTime', '20:00',
    'lunchStart', '13:00',
    'lunchEnd', '14:00'
  ),
  'saturday', JSON_OBJECT(
    'isOpen', true,
    'openTime', '09:00',
    'closeTime', '14:00',
    'lunchStart', NULL,
    'lunchEnd', NULL
  ),
  'sunday', JSON_OBJECT(
    'isOpen', false,
    'openTime', NULL,
    'closeTime', NULL,
    'lunchStart', NULL,
    'lunchEnd', NULL
  )
)
WHERE business_hours IS NULL;

-- ============================================
-- NOTAS
-- ============================================

-- Los horarios se usan para generar slots de disponibilidad
-- Si lunchStart y lunchEnd están definidos, no se generan slots en ese rango
-- Si isOpen es false, no se generan slots para ese día

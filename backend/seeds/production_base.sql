-- Seeds mínimos para producción
-- Solo se ejecutan si la base de datos está vacía

-- Insertar configuración de empresa por defecto
INSERT IGNORE INTO company_settings (
  id,
  company_name,
  company_description,
  contact_phone,
  contact_email
) VALUES (
  UUID(),
  'Clínica de Belleza',
  'Centro de belleza y bienestar dedicado a realzar tu belleza natural',
  '+56912345678',
  'contacto@clinica.cl'
);

-- Insertar banner de bienvenida
INSERT IGNORE INTO banners (
  id,
  title,
  description,
  `order`,
  active
) VALUES (
  UUID(),
  'Bienvenido a Clínica de Belleza',
  'Descubre nuestros servicios de belleza y bienestar',
  0,
  TRUE
);

-- Insertar slots de imágenes destacadas
INSERT IGNORE INTO featured_images (id, slot, title, active) 
VALUES (UUID(), 1, 'Imagen Destacada 1', TRUE);

INSERT IGNORE INTO featured_images (id, slot, title, active) 
VALUES (UUID(), 2, 'Imagen Destacada 2', TRUE);

INSERT IGNORE INTO featured_images (id, slot, title, active) 
VALUES (UUID(), 3, 'Imagen Destacada 3', TRUE);

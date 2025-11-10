-- Seed data para Base de Conocimientos
-- Datos de ejemplo sobre servicios, productos, tecnologías e ingredientes

USE clinica_belleza;

-- Obtener IDs de categorías
SET @cat_servicios = (SELECT id FROM knowledge_categories WHERE name = 'Servicios' LIMIT 1);
SET @cat_productos = (SELECT id FROM knowledge_categories WHERE name = 'Productos' LIMIT 1);
SET @cat_tecnologias = (SELECT id FROM knowledge_categories WHERE name = 'Tecnologías' LIMIT 1);
SET @cat_ingredientes = (SELECT id FROM knowledge_categories WHERE name = 'Ingredientes' LIMIT 1);
SET @cat_cuidados = (SELECT id FROM knowledge_categories WHERE name = 'Cuidados' LIMIT 1);
SET @cat_politicas = (SELECT id FROM knowledge_categories WHERE name = 'Políticas' LIMIT 1);

-- ==================== ARTÍCULOS ====================

INSERT INTO knowledge_articles (category_id, title, content, summary, keywords, tags, is_published, published_at) VALUES
(
  @cat_servicios,
  'Tratamiento Facial Profundo: Todo lo que necesitas saber',
  'El tratamiento facial profundo es uno de nuestros servicios más populares. Este tratamiento incluye:\n\n1. **Limpieza profunda**: Eliminación de impurezas y células muertas\n2. **Exfoliación**: Renovación celular con productos especializados\n3. **Extracción**: Limpieza de poros obstruidos (si es necesario)\n4. **Mascarilla personalizada**: Según tu tipo de piel\n5. **Masaje facial**: Estimula la circulación y relaja\n6. **Hidratación**: Productos de alta calidad\n\n**Duración**: 90 minutos\n**Precio**: $80\n**Frecuencia recomendada**: Cada 4-6 semanas\n\n**Beneficios**:\n- Piel más limpia y luminosa\n- Reducción de puntos negros\n- Mejora la textura de la piel\n- Hidratación profunda\n- Efecto anti-edad',
  'Tratamiento facial completo que incluye limpieza profunda, exfoliación, mascarilla y masaje. Ideal para todo tipo de piel.',
  '["facial", "tratamiento", "limpieza", "exfoliacion", "mascarilla", "hidratacion"]',
  '["facial", "tratamiento", "belleza", "cuidado-piel"]',
  TRUE,
  NOW()
),
(
  @cat_servicios,
  'Manicure con Gel: Duración y Cuidados',
  'El manicure con gel es perfecto para quienes buscan uñas impecables por más tiempo.\n\n**¿Qué incluye?**\n- Limado y forma de uñas\n- Cutícula profesional\n- Aplicación de base\n- 2 capas de color gel\n- Capa de brillo\n- Secado con lámpara UV/LED\n\n**Duración**: 45 minutos\n**Precio**: $35\n**Duración del resultado**: 3-4 semanas\n\n**Ventajas del gel**:\n- Mayor duración que esmalte tradicional\n- Secado instantáneo\n- Brillo intenso\n- No se descascara\n- Protege las uñas naturales\n\n**Colores disponibles**: Más de 100 tonos\n\n**Importante**: El gel debe ser removido profesionalmente para no dañar la uña natural.',
  'Manicure con esmalte gel de larga duración. Incluye limado, cutícula y aplicación profesional.',
  '["manicure", "gel", "uñas", "esmalte", "duracion"]',
  '["manicure", "uñas", "gel", "belleza"]',
  TRUE,
  NOW()
),
(
  @cat_tecnologias,
  'Microdermoabrasión: Tecnología de Punta para tu Piel',
  'La microdermoabrasión es un tratamiento no invasivo que utiliza tecnología avanzada para renovar la piel.\n\n**¿Cómo funciona?**\nUtilizamos un equipo especializado que:\n1. Exfolia suavemente la capa superficial de la piel\n2. Estimula la producción de colágeno\n3. Mejora la circulación sanguínea\n4. Succiona las células muertas\n\n**Beneficios**:\n- Reduce líneas finas y arrugas\n- Mejora textura de la piel\n- Disminuye manchas y cicatrices\n- Minimiza poros dilatados\n- Piel más luminosa y uniforme\n\n**Ideal para**:\n- Signos de envejecimiento\n- Cicatrices de acné\n- Manchas solares\n- Piel opaca\n- Poros dilatados\n\n**Sesiones recomendadas**: 6-8 sesiones para resultados óptimos\n**Frecuencia**: Cada 2-3 semanas\n**Sin tiempo de recuperación**: Puedes retomar tus actividades inmediatamente',
  'Tratamiento con tecnología de microdermoabrasión para renovar y rejuvenecer la piel.',
  '["microdermoabrasion", "tecnologia", "exfoliacion", "rejuvenecimiento", "piel"]',
  '["tecnologia", "facial", "anti-edad"]',
  TRUE,
  NOW()
);

-- ==================== TECNOLOGÍAS ====================

INSERT INTO knowledge_technologies (name, description, benefits, applications, related_services) VALUES
(
  'Lámpara UV/LED para Gel',
  'Tecnología de última generación para el secado y curado de esmaltes gel. Nuestra lámpara combina luz UV y LED para un secado rápido y uniforme, garantizando la durabilidad del esmalte.',
  '["Secado en 30-60 segundos", "Curado uniforme", "No daña la piel", "Ahorra tiempo", "Mayor durabilidad del gel"]',
  '["Manicure con gel", "Pedicure con gel", "Uñas acrílicas", "Extensiones de uñas"]',
  '[]'
),
(
  'Equipo de Microdermoabrasión Diamante',
  'Sistema profesional de microdermoabrasión con puntas de diamante de diferentes grosores. Permite un tratamiento personalizado según el tipo de piel y la condición a tratar.',
  '["Exfoliación precisa", "Diferentes intensidades", "Resultados visibles", "Sin químicos", "Estimula colágeno"]',
  '["Rejuvenecimiento facial", "Tratamiento de cicatrices", "Reducción de manchas", "Minimización de poros"]',
  '[]'
),
(
  'Vaporizador Facial Ozono',
  'Vaporizador profesional que combina vapor caliente con ozono para una limpieza profunda. El ozono tiene propiedades antibacterianas y ayuda a oxigenar la piel.',
  '["Abre los poros", "Limpieza profunda", "Efecto antibacteriano", "Hidrata la piel", "Prepara para otros tratamientos"]',
  '["Limpieza facial", "Tratamiento de acné", "Hidratación profunda", "Pre-tratamiento"]',
  '[]'
);

-- ==================== INGREDIENTES ====================

INSERT INTO knowledge_ingredients (name, description, benefits, precautions, related_products) VALUES
(
  'Ácido Hialurónico',
  'Molécula naturalmente presente en la piel que tiene la capacidad de retener hasta 1000 veces su peso en agua. Es uno de los ingredientes más efectivos para la hidratación profunda.',
  '["Hidratación intensa", "Rellena líneas finas", "Mejora elasticidad", "Efecto plumping", "Apto para todo tipo de piel"]',
  'Generalmente bien tolerado. En casos raros puede causar enrojecimiento temporal. No usar si hay alergia conocida al ingrediente.',
  '[]'
),
(
  'Vitamina C (Ácido Ascórbico)',
  'Potente antioxidante que protege la piel del daño ambiental y estimula la producción de colágeno. Ayuda a iluminar y unificar el tono de la piel.',
  '["Antioxidante potente", "Ilumina la piel", "Reduce manchas", "Estimula colágeno", "Protege del sol"]',
  'Puede causar sensibilidad en pieles muy sensibles. Usar protector solar durante el día. Almacenar en lugar fresco y oscuro.',
  '[]'
),
(
  'Retinol (Vitamina A)',
  'Ingrediente anti-edad por excelencia. Acelera la renovación celular, reduce arrugas y mejora la textura de la piel.',
  '["Reduce arrugas", "Mejora textura", "Unifica tono", "Estimula colágeno", "Trata acné"]',
  'No usar durante embarazo o lactancia. Puede causar irritación inicial. Usar solo de noche y siempre con protector solar durante el día. Introducir gradualmente.',
  '[]'
),
(
  'Niacinamida (Vitamina B3)',
  'Ingrediente versátil que beneficia a todo tipo de piel. Regula la producción de sebo, reduce poros y mejora la barrera cutánea.',
  '["Reduce poros", "Controla grasa", "Ilumina", "Fortalece barrera cutánea", "Anti-inflamatorio"]',
  'Muy bien tolerado. Apto para pieles sensibles. Puede usarse día y noche.',
  '[]'
);

-- ==================== MÁS FAQs ====================

INSERT INTO knowledge_faqs (category_id, question, answer, keywords, display_order) VALUES
(
  @cat_servicios,
  '¿Puedo hacerme un facial si tengo acné activo?',
  'Sí, de hecho es recomendable. Tenemos tratamientos faciales específicos para piel con acné que incluyen limpieza profunda, extracción profesional y productos antibacterianos. Sin embargo, si tienes acné quístico severo, te recomendamos consultar primero con un dermatólogo.',
  '["acne", "facial", "piel", "granos", "espinillas"]',
  3
),
(
  @cat_servicios,
  '¿Cuál es la diferencia entre manicure tradicional y con gel?',
  'El manicure tradicional usa esmalte regular que se seca al aire y dura aproximadamente 5-7 días. El manicure con gel usa esmalte especial que se cura con lámpara UV/LED, dura 3-4 semanas, tiene acabado más brillante y no se descascara. El gel requiere remoción profesional.',
  '["manicure", "gel", "diferencia", "esmalte", "duracion"]',
  4
),
(
  @cat_tecnologias,
  '¿La microdermoabrasión duele?',
  'No, la microdermoabrasión no duele. Puedes sentir una ligera sensación de raspado o cosquilleo, pero es completamente tolerable. Algunos clientes incluso lo encuentran relajante. No requiere anestesia y puedes retomar tus actividades normales inmediatamente después.',
  '["microdermoabrasion", "dolor", "molestia", "sensacion"]',
  1
),
(
  @cat_cuidados,
  '¿Puedo maquillarme después de un facial?',
  'Recomendamos esperar al menos 24 horas antes de aplicar maquillaje después de un facial. Esto permite que tu piel respire y absorba completamente los productos del tratamiento. Si es absolutamente necesario, usa solo productos minerales ligeros.',
  '["maquillaje", "facial", "despues", "cuidados", "post-tratamiento"]',
  2
),
(
  @cat_cuidados,
  '¿Cómo cuido mis uñas con gel en casa?',
  'Para mantener tu manicure con gel: 1) Usa guantes al limpiar, 2) Aplica aceite de cutícula diariamente, 3) No uses tus uñas como herramientas, 4) Hidrata tus manos regularmente, 5) No intentes remover el gel tú misma, 6) Regresa para mantenimiento cada 3-4 semanas.',
  '["cuidados", "gel", "uñas", "mantenimiento", "casa"]',
  3
),
(
  @cat_politicas,
  '¿Ofrecen paquetes o membresías?',
  'Sí, ofrecemos varios paquetes y programas de membresía con descuentos especiales. Nuestros paquetes incluyen combinaciones de servicios populares con ahorro de hasta 20%. Las membresías mensuales incluyen servicios recurrentes con precio preferencial. Pregunta por nuestras opciones al agendar.',
  '["paquetes", "membresia", "descuentos", "promociones", "ofertas"]',
  2
),
(
  @cat_politicas,
  '¿Aceptan tarjetas de crédito?',
  'Sí, aceptamos todas las tarjetas de crédito y débito principales (Visa, Mastercard, American Express). También aceptamos efectivo y transferencias bancarias. Para tu comodidad, puedes pagar al finalizar tu servicio.',
  '["pago", "tarjeta", "credito", "efectivo", "formas de pago"]',
  3
);

-- ==================== ARTÍCULOS ADICIONALES ====================

INSERT INTO knowledge_articles (category_id, title, content, summary, keywords, tags, is_published, published_at) VALUES
(
  @cat_productos,
  'Línea de Productos para el Hogar',
  'Complementa tus tratamientos en la clínica con nuestra línea exclusiva de productos para el hogar.\n\n**Limpiadores Faciales**\n- Gel limpiador suave: Para todo tipo de piel\n- Espuma limpiadora: Para piel grasa\n- Leche limpiadora: Para piel seca\n\n**Sueros y Tratamientos**\n- Suero de Vitamina C: Iluminador y antioxidante\n- Suero de Ácido Hialurónico: Hidratación profunda\n- Suero de Retinol: Anti-edad nocturno\n\n**Hidratantes**\n- Crema día SPF 50: Protección y hidratación\n- Crema noche: Reparación intensiva\n- Gel hidratante: Para piel grasa\n\n**Mascarillas**\n- Mascarilla de arcilla: Purificante\n- Mascarilla hidratante: Nutrición intensa\n- Mascarilla iluminadora: Efecto glow\n\nTodos nuestros productos son dermatológicamente probados y libres de parabenos.',
  'Línea completa de productos profesionales para el cuidado de la piel en casa.',
  '["productos", "cuidado", "piel", "casa", "linea", "profesional"]',
  '["productos", "skincare", "belleza"]',
  TRUE,
  NOW()
),
(
  @cat_cuidados,
  'Preparación para tu Primera Cita',
  '¿Primera vez en nuestra clínica? Aquí te decimos cómo prepararte:\n\n**Antes de tu cita**:\n1. Llega 10 minutos antes para completar formulario\n2. Ven sin maquillaje si es tratamiento facial\n3. Evita exfoliantes 48h antes\n4. Informa sobre alergias o medicamentos\n5. Trae ropa cómoda\n\n**Durante tu cita**:\n- Relájate y disfruta\n- Comunica cualquier molestia\n- Pregunta todas tus dudas\n- Nuestro equipo te guiará en todo momento\n\n**Después de tu cita**:\n- Sigue las recomendaciones de cuidado\n- Agenda tu próxima cita\n- Comparte tu experiencia\n\n**Qué esperar**:\n- Consulta personalizada\n- Tratamiento profesional\n- Recomendaciones de cuidado\n- Ambiente relajante y limpio',
  'Guía completa para prepararte para tu primera visita a la clínica.',
  '["primera", "cita", "preparacion", "que esperar", "nueva", "cliente"]',
  '["guia", "primera-vez", "preparacion"]',
  TRUE,
  NOW()
);

COMMIT;

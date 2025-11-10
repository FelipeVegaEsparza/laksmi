/**
 * Migración: Base de Conocimientos para Chatbot
 * Descripción: Tablas para almacenar información que el chatbot puede usar para responder preguntas
 */

exports.up = async function(knex) {
  // Tabla de categorías de conocimiento
  await knex.schema.createTable('knowledge_categories', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('(UUID())'));
    table.string('name', 100).notNullable();
    table.text('description');
    table.string('icon', 50);
    table.integer('display_order').defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    
    table.index('is_active', 'idx_active');
    table.index('display_order', 'idx_order');
  });

  // Tabla de artículos de conocimiento
  await knex.schema.createTable('knowledge_articles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('(UUID())'));
    table.uuid('category_id').notNullable();
    table.string('title', 255).notNullable();
    table.text('content').notNullable();
    table.string('summary', 500);
    table.text('keywords'); // JSON array
    table.text('tags'); // JSON array
    table.text('related_services'); // JSON array
    table.text('related_products'); // JSON array
    table.integer('view_count').defaultTo(0);
    table.integer('helpful_count').defaultTo(0);
    table.integer('not_helpful_count').defaultTo(0);
    table.boolean('is_published').defaultTo(true);
    table.timestamp('published_at').nullable();
    table.string('created_by', 36);
    table.string('updated_by', 36);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    
    table.foreign('category_id').references('knowledge_categories.id').onDelete('CASCADE');
    table.index('category_id', 'idx_category');
    table.index('is_published', 'idx_published');
    table.index('view_count', 'idx_views');
  });

  // Crear índice FULLTEXT para artículos (después de crear la tabla)
  await knex.raw('CREATE FULLTEXT INDEX idx_search ON knowledge_articles(title, content, summary, keywords)');

  // Tabla de preguntas frecuentes (FAQ)
  await knex.schema.createTable('knowledge_faqs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('(UUID())'));
    table.uuid('category_id').notNullable();
    table.text('question').notNullable();
    table.text('answer').notNullable();
    table.text('keywords'); // JSON array
    table.integer('display_order').defaultTo(0);
    table.integer('view_count').defaultTo(0);
    table.integer('helpful_count').defaultTo(0);
    table.integer('not_helpful_count').defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    
    table.foreign('category_id').references('knowledge_categories.id').onDelete('CASCADE');
    table.index('category_id', 'idx_category');
    table.index('is_active', 'idx_active');
    table.index('display_order', 'idx_order');
  });

  // Crear índice FULLTEXT para FAQs
  await knex.raw('CREATE FULLTEXT INDEX idx_search ON knowledge_faqs(question, answer, keywords)');

  // Tabla de tecnologías y equipos
  await knex.schema.createTable('knowledge_technologies', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('(UUID())'));
    table.string('name', 200).notNullable();
    table.text('description').notNullable();
    table.text('benefits'); // JSON array
    table.text('applications'); // JSON array
    table.text('related_services'); // JSON array
    table.string('image_url', 500);
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    
    table.index('is_active', 'idx_active');
  });

  // Crear índice FULLTEXT para tecnologías
  await knex.raw('CREATE FULLTEXT INDEX idx_search ON knowledge_technologies(name, description)');

  // Tabla de ingredientes y componentes
  await knex.schema.createTable('knowledge_ingredients', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('(UUID())'));
    table.string('name', 200).notNullable();
    table.text('description').notNullable();
    table.text('benefits'); // JSON array
    table.text('precautions');
    table.text('related_products'); // JSON array
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    
    table.index('is_active', 'idx_active');
  });

  // Crear índice FULLTEXT para ingredientes
  await knex.raw('CREATE FULLTEXT INDEX idx_search ON knowledge_ingredients(name, description)');

  // Tabla de búsquedas del chatbot (para analytics)
  await knex.schema.createTable('knowledge_searches', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('(UUID())'));
    table.string('conversation_id', 36);
    table.text('query').notNullable();
    table.integer('results_found').defaultTo(0);
    table.text('result_ids'); // JSON array
    table.boolean('was_helpful').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index('conversation_id', 'idx_conversation');
    table.index('created_at', 'idx_created');
  });

  // Crear índice FULLTEXT para búsquedas
  await knex.raw('CREATE FULLTEXT INDEX idx_query ON knowledge_searches(query)');

  // Insertar categorías iniciales
  await knex('knowledge_categories').insert([
    { name: 'Servicios', description: 'Información sobre nuestros servicios de belleza', icon: 'spa', display_order: 1 },
    { name: 'Productos', description: 'Detalles sobre productos que utilizamos y vendemos', icon: 'shopping_bag', display_order: 2 },
    { name: 'Tecnologías', description: 'Equipos y tecnologías que utilizamos', icon: 'settings', display_order: 3 },
    { name: 'Ingredientes', description: 'Información sobre ingredientes y componentes', icon: 'science', display_order: 4 },
    { name: 'Cuidados', description: 'Cuidados pre y post tratamiento', icon: 'favorite', display_order: 5 },
    { name: 'Políticas', description: 'Políticas de la clínica', icon: 'policy', display_order: 6 }
  ]);

  // Obtener IDs de categorías para los FAQs
  const serviciosCategory = await knex('knowledge_categories').where('name', 'Servicios').first();
  const productosCategory = await knex('knowledge_categories').where('name', 'Productos').first();
  const politicasCategory = await knex('knowledge_categories').where('name', 'Políticas').first();
  const cuidadosCategory = await knex('knowledge_categories').where('name', 'Cuidados').first();

  // Insertar FAQs iniciales
  await knex('knowledge_faqs').insert([
    {
      category_id: serviciosCategory.id,
      question: '¿Cuánto dura un tratamiento facial?',
      answer: 'La duración de un tratamiento facial varía según el tipo de servicio. Un facial básico dura aproximadamente 60 minutos, mientras que tratamientos más especializados como el facial con microdermoabrasión pueden durar hasta 90 minutos. Te recomendamos consultar la duración específica al momento de agendar tu cita.',
      keywords: JSON.stringify(['duracion', 'tiempo', 'facial', 'tratamiento', 'cuanto dura']),
      display_order: 1
    },
    {
      category_id: serviciosCategory.id,
      question: '¿Cada cuánto debo hacerme un tratamiento de manicure?',
      answer: 'Para mantener tus uñas saludables y hermosas, recomendamos un manicure cada 2-3 semanas. Si optas por manicure con gel, puede durar hasta 3-4 semanas. El cuidado regular ayuda a prevenir problemas y mantener la salud de tus uñas.',
      keywords: JSON.stringify(['frecuencia', 'manicure', 'cada cuanto', 'regularidad', 'mantenimiento']),
      display_order: 2
    },
    {
      category_id: productosCategory.id,
      question: '¿Qué productos utilizan en los tratamientos?',
      answer: 'Utilizamos productos de alta calidad de marcas reconocidas internacionalmente. Todos nuestros productos son dermatológicamente probados y seleccionados específicamente para cada tipo de piel. Incluyen ingredientes naturales y activos que garantizan resultados efectivos y seguros.',
      keywords: JSON.stringify(['productos', 'marcas', 'calidad', 'que usan', 'ingredientes']),
      display_order: 1
    },
    {
      category_id: politicasCategory.id,
      question: '¿Cuál es la política de cancelación?',
      answer: 'Puedes cancelar o reprogramar tu cita con al menos 24 horas de anticipación sin ningún cargo. Cancelaciones con menos de 24 horas de anticipación o no presentarse a la cita pueden estar sujetas a un cargo del 50% del valor del servicio.',
      keywords: JSON.stringify(['cancelacion', 'reprogramar', 'politica', 'cambiar cita', 'no asistir']),
      display_order: 1
    },
    {
      category_id: cuidadosCategory.id,
      question: '¿Qué cuidados debo tener después de un tratamiento facial?',
      answer: 'Después de un tratamiento facial: 1) Evita maquillaje por 24 horas, 2) No expongas tu piel al sol directo, 3) Usa protector solar SPF 50+, 4) Mantén tu piel hidratada, 5) Evita ejercicio intenso por 24 horas, 6) No uses productos exfoliantes por 3 días.',
      keywords: JSON.stringify(['cuidados', 'despues', 'post tratamiento', 'recomendaciones', 'facial']),
      display_order: 1
    }
  ]);
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('knowledge_searches');
  await knex.schema.dropTableIfExists('knowledge_ingredients');
  await knex.schema.dropTableIfExists('knowledge_technologies');
  await knex.schema.dropTableIfExists('knowledge_faqs');
  await knex.schema.dropTableIfExists('knowledge_articles');
  await knex.schema.dropTableIfExists('knowledge_categories');
};

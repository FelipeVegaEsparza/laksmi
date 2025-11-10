exports.up = function(knex) {
  return knex.schema.createTable('services', (table) => {
    table.string('id', 36).primary().defaultTo(knex.raw('(UUID())'));
    table.string('name', 255).notNullable();
    table.string('category', 100).notNullable();
    table.decimal('price', 10, 2).notNullable();
    table.integer('duration').notNullable().comment('Duración en minutos');
    table.text('description').nullable();
    table.json('images').nullable();
    table.json('requirements').nullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // Índices
    table.index('category');
    table.index('is_active');
    table.index('price');
    table.index('created_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('services');
};
exports.up = function(knex) {
  return knex.schema.createTable('professionals', (table) => {
    table.string('id', 36).primary().defaultTo(knex.raw('(UUID())'));
    table.string('name', 255).notNullable();
    table.json('specialties').nullable();
    table.json('schedule').nullable().comment('Horarios de trabajo por día');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // Índices
    table.index('is_active');
    table.index('created_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('professionals');
};
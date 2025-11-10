exports.up = function(knex) {
  return knex.schema.createTable('clients', (table) => {
    table.string('id', 36).primary().defaultTo(knex.raw('(UUID())'));
    table.string('phone', 20).unique().notNullable();
    table.string('name', 255).notNullable();
    table.string('email', 255).nullable();
    table.json('allergies').nullable();
    table.json('preferences').nullable();
    table.integer('loyalty_points').defaultTo(0);
    table.timestamps(true, true);
    
    // Índices
    table.index('phone');
    table.index('email');
    table.index('created_at');
    table.index('loyalty_points');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('clients');
};
exports.up = function(knex) {
  return knex.schema.createTable('categories', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('(UUID())'));
    table.string('name', 100).notNullable().unique();
    table.enum('type', ['service', 'product']).notNullable();
    table.text('description');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index(['type', 'is_active']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('categories');
};

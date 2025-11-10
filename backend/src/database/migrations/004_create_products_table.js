exports.up = function(knex) {
  return knex.schema.createTable('products', (table) => {
    table.string('id', 36).primary().defaultTo(knex.raw('(UUID())'));
    table.string('name', 255).notNullable();
    table.string('category', 100).notNullable();
    table.decimal('price', 10, 2).notNullable();
    table.integer('stock').notNullable();
    table.integer('min_stock').defaultTo(5);
    table.json('ingredients').nullable();
    table.json('compatible_services').nullable();
    table.timestamps(true, true);
    
    // Índices
    table.index('category');
    table.index('stock');
    table.index('price');
    table.index('created_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('products');
};
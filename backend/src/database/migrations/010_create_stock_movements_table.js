exports.up = function(knex) {
  return knex.schema.createTable('stock_movements', (table) => {
    table.string('id', 36).primary().defaultTo(knex.raw('(UUID())'));
    table.string('product_id', 36).notNullable();
    table.enum('type', ['in', 'out', 'adjustment']).notNullable();
    table.integer('quantity').notNullable();
    table.string('reason', 500).notNullable();
    table.string('reference_id', 36).nullable();
    table.timestamps(true, true);
    
    // Claves foráneas
    table.foreign('product_id').references('id').inTable('products').onDelete('CASCADE');
    
    // Índices
    table.index('product_id');
    table.index('type');
    table.index('created_at');
    table.index('reference_id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('stock_movements');
};
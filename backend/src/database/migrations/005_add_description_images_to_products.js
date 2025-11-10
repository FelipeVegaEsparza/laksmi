exports.up = function(knex) {
  return knex.schema.alterTable('products', (table) => {
    table.text('description').nullable();
    table.json('images').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('products', (table) => {
    table.dropColumn('description');
    table.dropColumn('images');
  });
};
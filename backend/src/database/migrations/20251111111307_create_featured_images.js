/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('featured_images', (table) => {
    table.increments('id').primary();
    table.integer('slot').notNullable().unique();
    table.string('image_url', 500).notNullable();
    table.string('title', 255).nullable();
    table.text('description').nullable();
    table.string('link_url', 500).nullable();
    table.boolean('active').defaultTo(true);
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('featured_images');
};

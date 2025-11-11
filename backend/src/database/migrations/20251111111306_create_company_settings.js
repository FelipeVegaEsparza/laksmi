/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('company_settings', (table) => {
    table.increments('id').primary();
    table.string('company_name', 255).notNullable();
    table.string('phone', 50).nullable();
    table.string('email', 255).nullable();
    table.text('address').nullable();
    table.string('whatsapp', 50).nullable();
    table.string('facebook', 255).nullable();
    table.string('instagram', 255).nullable();
    table.string('twitter', 255).nullable();
    table.string('logo_url', 500).nullable();
    table.text('description').nullable();
    table.string('currency', 10).defaultTo('CLP');
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('company_settings');
};

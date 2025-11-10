exports.up = function(knex) {
  return knex.schema.createTable('users', (table) => {
    table.string('id', 36).primary().defaultTo(knex.raw('(UUID())'));
    table.string('username', 100).unique().notNullable();
    table.string('email', 255).unique().notNullable();
    table.string('password_hash', 255).notNullable();
    table.enum('role', ['admin', 'manager', 'staff']).defaultTo('staff');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('last_login').nullable();
    table.timestamps(true, true);
    
    // Índices
    table.index('username');
    table.index('email');
    table.index('role');
    table.index('is_active');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
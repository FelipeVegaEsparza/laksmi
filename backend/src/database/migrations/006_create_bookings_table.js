exports.up = function(knex) {
  return knex.schema.createTable('bookings', (table) => {
    table.string('id', 36).primary().defaultTo(knex.raw('(UUID())'));
    table.string('client_id', 36).notNullable();
    table.string('service_id', 36).notNullable();
    table.string('professional_id', 36).nullable();
    table.datetime('date_time').notNullable();
    table.integer('duration').notNullable().comment('Duración en minutos');
    table.enum('status', ['confirmed', 'cancelled', 'completed', 'no_show']).defaultTo('confirmed');
    table.text('notes').nullable();
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('client_id').references('id').inTable('clients').onDelete('CASCADE');
    table.foreign('service_id').references('id').inTable('services').onDelete('RESTRICT');
    table.foreign('professional_id').references('id').inTable('professionals').onDelete('SET NULL');
    
    // Índices
    table.index(['client_id', 'date_time']);
    table.index(['professional_id', 'date_time']);
    table.index('status');
    table.index('date_time');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('bookings');
};
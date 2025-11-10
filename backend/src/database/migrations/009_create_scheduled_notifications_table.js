exports.up = function(knex) {
  return knex.schema.createTable('scheduled_notifications', (table) => {
    table.string('id', 36).primary().defaultTo(knex.raw('(UUID())'));
    table.string('client_id', 36).notNullable();
    table.string('booking_id', 36).nullable();
    table.enum('type', ['appointment_reminder', 'follow_up', 'promotion']).notNullable();
    table.enum('channel', ['whatsapp', 'email', 'sms']).notNullable();
    table.datetime('scheduled_for').notNullable();
    table.enum('status', ['pending', 'sent', 'failed']).defaultTo('pending');
    table.string('template_name', 100).nullable();
    table.json('template_data').nullable();
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('client_id').references('id').inTable('clients').onDelete('CASCADE');
    table.foreign('booking_id').references('id').inTable('bookings').onDelete('CASCADE');
    
    // Índices
    table.index('scheduled_for');
    table.index('status');
    table.index(['type', 'channel']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('scheduled_notifications');
};
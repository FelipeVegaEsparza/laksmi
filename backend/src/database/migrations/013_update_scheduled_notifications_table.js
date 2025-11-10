exports.up = function(knex) {
  return knex.schema.alterTable('scheduled_notifications', (table) => {
    // Agregar nuevos tipos de notificación
    table.dropColumn('type');
  }).then(() => {
    return knex.schema.alterTable('scheduled_notifications', (table) => {
      table.enum('type', [
        'appointment_reminder',
        'appointment_confirmation', 
        'appointment_cancellation',
        'follow_up',
        'promotion',
        'birthday_greeting',
        'loyalty_reward'
      ]).notNullable().after('booking_id');
    });
  }).then(() => {
    return knex.schema.alterTable('scheduled_notifications', (table) => {
      // Agregar nuevo estado 'cancelled'
      table.dropColumn('status');
    });
  }).then(() => {
    return knex.schema.alterTable('scheduled_notifications', (table) => {
      table.enum('status', ['pending', 'sent', 'failed', 'cancelled']).defaultTo('pending').after('scheduled_for');
    });
  }).then(() => {
    return knex.schema.alterTable('scheduled_notifications', (table) => {
      // Agregar campos adicionales
      table.datetime('sent_at').nullable().after('template_data');
      table.text('error_message').nullable().after('sent_at');
      table.integer('retry_count').defaultTo(0).after('error_message');
      table.string('external_id', 100).nullable().after('retry_count').comment('ID del proveedor externo (Twilio, etc.)');
      
      // Agregar índices adicionales
      table.index(['client_id', 'type']);
      table.index(['booking_id', 'type']);
      table.index('retry_count');
    });
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('scheduled_notifications', (table) => {
    // Remover campos agregados
    table.dropColumn('sent_at');
    table.dropColumn('error_message');
    table.dropColumn('retry_count');
    table.dropColumn('external_id');
    
    // Remover índices
    table.dropIndex(['client_id', 'type']);
    table.dropIndex(['booking_id', 'type']);
    table.dropIndex('retry_count');
  }).then(() => {
    // Revertir enum de status
    return knex.schema.alterTable('scheduled_notifications', (table) => {
      table.dropColumn('status');
    });
  }).then(() => {
    return knex.schema.alterTable('scheduled_notifications', (table) => {
      table.enum('status', ['pending', 'sent', 'failed']).defaultTo('pending');
    });
  }).then(() => {
    // Revertir enum de type
    return knex.schema.alterTable('scheduled_notifications', (table) => {
      table.dropColumn('type');
    });
  }).then(() => {
    return knex.schema.alterTable('scheduled_notifications', (table) => {
      table.enum('type', ['appointment_reminder', 'follow_up', 'promotion']).notNullable();
    });
  });
};
exports.up = function(knex) {
  return knex.schema.createTable('conversations', (table) => {
    table.string('id', 36).primary().defaultTo(knex.raw('(UUID())'));
    table.string('client_id', 36).notNullable();
    table.enum('channel', ['web', 'whatsapp']).notNullable();
    table.enum('status', ['active', 'closed', 'escalated']).defaultTo('active');
    table.json('context').nullable().comment('Contexto de la conversación');
    table.timestamp('last_activity').defaultTo(knex.fn.now());
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('client_id').references('id').inTable('clients').onDelete('CASCADE');
    
    // Índices
    table.index(['client_id', 'channel']);
    table.index('last_activity');
    table.index('status');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('conversations');
};
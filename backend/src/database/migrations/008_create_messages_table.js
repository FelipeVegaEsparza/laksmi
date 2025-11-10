exports.up = function(knex) {
  return knex.schema.createTable('messages', (table) => {
    table.string('id', 36).primary().defaultTo(knex.raw('(UUID())'));
    table.string('conversation_id', 36).notNullable();
    table.enum('sender_type', ['client', 'ai', 'human']).notNullable();
    table.text('content').notNullable();
    table.text('media_url').nullable();
    table.json('metadata').nullable().comment('Metadatos adicionales del mensaje');
    table.timestamp('timestamp').defaultTo(knex.fn.now());
    
    // Foreign keys
    table.foreign('conversation_id').references('id').inTable('conversations').onDelete('CASCADE');
    
    // Índices
    table.index(['conversation_id', 'timestamp']);
    table.index('sender_type');
    table.index('timestamp');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('messages');
};
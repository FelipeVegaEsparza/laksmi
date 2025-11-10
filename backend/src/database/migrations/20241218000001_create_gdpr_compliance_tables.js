/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return Promise.all([
    // Consent records table
    knex.schema.createTable('consent_records', function(table) {
      table.string('id', 100).primary();
      table.string('client_id', 36).notNullable();
      table.enum('consent_type', [
        'WHATSAPP_COMMUNICATION', 
        'DATA_PROCESSING', 
        'MARKETING', 
        'ANALYTICS'
      ]).notNullable();
      table.boolean('granted').notNullable();
      table.timestamp('granted_at').nullable();
      table.timestamp('revoked_at').nullable();
      table.text('ip_address').notNullable(); // Encrypted
      table.text('user_agent').nullable(); // Encrypted
      table.enum('source', ['WEB', 'WHATSAPP', 'ADMIN']).notNullable();
      table.enum('legal_basis', [
        'CONSENT', 
        'CONTRACT', 
        'LEGITIMATE_INTEREST', 
        'LEGAL_OBLIGATION'
      ]).notNullable();
      table.text('purpose').notNullable();
      table.json('data_categories').notNullable();
      table.integer('retention_period').notNullable(); // days
      table.timestamps(true, true);
      
      table.foreign('client_id').references('id').inTable('clients').onDelete('CASCADE');
      table.index(['client_id', 'consent_type']);
      table.index('created_at');
    }),

    // Pending consent requests table
    knex.schema.createTable('pending_consents', function(table) {
      table.string('id', 100).primary();
      table.string('client_id', 36).notNullable();
      table.string('consent_token', 100).notNullable().unique();
      table.enum('consent_type', [
        'WHATSAPP_COMMUNICATION', 
        'DATA_PROCESSING', 
        'MARKETING', 
        'ANALYTICS'
      ]).notNullable();
      table.text('phone_number').notNullable(); // Encrypted
      table.timestamp('expires_at').notNullable();
      table.timestamps(true, true);
      
      table.foreign('client_id').references('id').inTable('clients').onDelete('CASCADE');
      table.index('consent_token');
      table.index('expires_at');
    }),

    // Data export requests table
    knex.schema.createTable('data_export_requests', function(table) {
      table.increments('id').primary();
      table.string('client_id', 36).notNullable();
      table.string('requested_by', 100).notNullable();
      table.timestamp('request_date').notNullable();
      table.enum('status', ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).notNullable();
      table.json('export_data').nullable();
      table.timestamp('completed_at').nullable();
      table.timestamps(true, true);
      
      table.foreign('client_id').references('id').inTable('clients').onDelete('CASCADE');
      table.index(['client_id', 'status']);
      table.index('request_date');
    }),

    // Data deletion requests table
    knex.schema.createTable('data_deletion_requests', function(table) {
      table.string('id', 100).primary();
      table.string('client_id', 36).notNullable();
      table.string('requested_by', 100).notNullable();
      table.text('reason').notNullable();
      table.json('deleted_records').notNullable();
      table.json('retained_records').notNullable();
      table.json('retention_reasons').notNullable();
      table.timestamp('processed_at').notNullable();
      table.timestamps(true, true);
      
      table.index('client_id');
      table.index('processed_at');
    })
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return Promise.all([
    knex.schema.dropTableIfExists('data_deletion_requests'),
    knex.schema.dropTableIfExists('data_export_requests'),
    knex.schema.dropTableIfExists('pending_consents'),
    knex.schema.dropTableIfExists('consent_records')
  ]);
};
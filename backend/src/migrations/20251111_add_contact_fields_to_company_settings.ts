import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Verificar si las columnas ya existen antes de agregarlas
  const hasContactAddress = await knex.schema.hasColumn('company_settings', 'contact_address');
  const hasContactEmail = await knex.schema.hasColumn('company_settings', 'contact_email');
  const hasContactPhone = await knex.schema.hasColumn('company_settings', 'contact_phone');

  if (!hasContactAddress || !hasContactEmail || !hasContactPhone) {
    await knex.schema.alterTable('company_settings', (table) => {
      if (!hasContactAddress) {
        table.string('contact_address', 500).nullable();
      }
      if (!hasContactEmail) {
        table.string('contact_email', 255).nullable();
      }
      if (!hasContactPhone) {
        table.string('contact_phone', 50).nullable();
      }
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('company_settings', (table) => {
    table.dropColumn('contact_address');
    table.dropColumn('contact_email');
    table.dropColumn('contact_phone');
  });
}

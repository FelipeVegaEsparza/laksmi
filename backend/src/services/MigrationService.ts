import fs from 'fs';
import path from 'path';
import db from '../config/database';
import logger from '../utils/logger';

export class MigrationService {
  private static migrationsPath = path.join(__dirname, '../../migrations');

  /**
   * Ejecuta todas las migraciones pendientes
   */
  static async runMigrations(): Promise<void> {
    try {
      logger.info('🔄 Iniciando proceso de migraciones...');

      // Verificar si existe la tabla de control de migraciones
      await this.ensureMigrationsTable();

      // Obtener migraciones ejecutadas
      const executedMigrations = await this.getExecutedMigrations();
      logger.info(`📋 Migraciones ejecutadas: ${executedMigrations.length}`);

      // Obtener archivos de migración disponibles
      const availableMigrations = await this.getAvailableMigrations();
      logger.info(`📁 Migraciones disponibles: ${availableMigrations.length}`);

      // Filtrar migraciones pendientes
      const pendingMigrations = availableMigrations.filter(
        (migration) => !executedMigrations.includes(migration)
      );

      if (pendingMigrations.length === 0) {
        logger.info('✅ No hay migraciones pendientes');
        return;
      }

      logger.info(`🔄 Ejecutando ${pendingMigrations.length} migraciones pendientes...`);

      // Ejecutar cada migración pendiente
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }

      logger.info('✅ Todas las migraciones se ejecutaron correctamente');
    } catch (error) {
      logger.error('❌ Error ejecutando migraciones:', error);
      throw error;
    }
  }

  /**
   * Asegura que existe la tabla de control de migraciones
   */
  private static async ensureMigrationsTable(): Promise<void> {
    const tableExists = await db.schema.hasTable('schema_migrations');
    
    if (!tableExists) {
      logger.info('📋 Creando tabla de control de migraciones...');
      await db.schema.createTable('schema_migrations', (table) => {
        table.increments('id').primary();
        table.string('filename', 255).notNullable().unique();
        table.timestamp('executed_at').defaultTo(db.fn.now());
      });
      logger.info('✅ Tabla schema_migrations creada');
    }
  }

  /**
   * Obtiene la lista de migraciones ya ejecutadas
   */
  private static async getExecutedMigrations(): Promise<string[]> {
    const rows = await db('schema_migrations')
      .select('filename')
      .orderBy('id', 'asc');
    
    return rows.map((row) => row.filename);
  }

  /**
   * Obtiene la lista de archivos de migración disponibles
   */
  private static async getAvailableMigrations(): Promise<string[]> {
    if (!fs.existsSync(this.migrationsPath)) {
      logger.warn(`⚠️  Directorio de migraciones no encontrado: ${this.migrationsPath}`);
      return [];
    }

    const files = fs.readdirSync(this.migrationsPath);
    
    // Filtrar solo archivos .sql y ordenar
    const sqlFiles = files
      .filter((file) => file.endsWith('.sql'))
      .sort();

    return sqlFiles;
  }

  /**
   * Ejecuta una migración específica
   */
  private static async executeMigration(filename: string): Promise<void> {
    const filePath = path.join(this.migrationsPath, filename);
    
    try {
      logger.info(`🔄 Ejecutando migración: ${filename}`);

      // Leer el contenido del archivo SQL
      const sql = fs.readFileSync(filePath, 'utf8');

      // Dividir en statements individuales (separados por ;)
      // Filtrar comentarios y líneas vacías
      const statements = sql
        .split(';')
        .map((stmt) => stmt.trim())
        .filter((stmt) => {
          // Eliminar comentarios de línea completa
          const lines = stmt.split('\n').filter((line) => {
            const trimmed = line.trim();
            return trimmed && !trimmed.startsWith('--');
          });
          return lines.length > 0 && lines.join('').length > 0;
        });

      // Ejecutar cada statement dentro de una transacción
      await db.transaction(async (trx) => {
        for (const statement of statements) {
          if (statement) {
            await trx.raw(statement);
          }
        }

        // Registrar la migración como ejecutada
        await trx('schema_migrations').insert({
          filename,
          executed_at: new Date(),
        });
      });

      logger.info(`✅ Migración ejecutada: ${filename}`);
    } catch (error) {
      logger.error(`❌ Error ejecutando migración ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene el estado de las migraciones
   */
  static async getMigrationStatus(): Promise<{
    executed: string[];
    pending: string[];
    total: number;
  }> {
    await this.ensureMigrationsTable();
    
    const executed = await this.getExecutedMigrations();
    const available = await this.getAvailableMigrations();
    const pending = available.filter((m) => !executed.includes(m));

    return {
      executed,
      pending,
      total: available.length,
    };
  }
}

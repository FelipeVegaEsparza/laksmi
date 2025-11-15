import fs from 'fs';
import path from 'path';
import db from '../config/database';
import logger from '../utils/logger';

interface Migration {
  id: number;
  filename: string;
  executed_at: Date;
}

export class DatabaseMigrator {
  private migrationsPath: string;

  constructor() {
    // Buscar migraciones en la carpeta migrations del proyecto
    this.migrationsPath = path.join(__dirname, '../../migrations');
  }

  /**
   * Crear tabla de control de migraciones si no existe
   */
  private async ensureMigrationsTable(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_filename (filename)
      )
    `;
    
    await db.raw(createTableSQL);
    logger.info('✅ Tabla de control de migraciones verificada');
  }

  /**
   * Obtener lista de migraciones ya ejecutadas
   */
  private async getExecutedMigrations(): Promise<string[]> {
    try {
      const migrations = await db('schema_migrations')
        .select('filename')
        .orderBy('id', 'asc');
      
      return migrations.map(m => m.filename);
    } catch (error) {
      logger.warn('No se pudieron obtener migraciones ejecutadas:', error);
      return [];
    }
  }

  /**
   * Obtener lista de archivos de migración disponibles
   */
  private async getAvailableMigrations(): Promise<string[]> {
    try {
      if (!fs.existsSync(this.migrationsPath)) {
        logger.warn(`⚠️  Carpeta de migraciones no encontrada: ${this.migrationsPath}`);
        return [];
      }

      const files = fs.readdirSync(this.migrationsPath);
      
      // Filtrar solo archivos .sql y ordenar
      const sqlFiles = files
        .filter(f => f.endsWith('.sql'))
        .sort(); // Orden alfabético (por eso usamos prefijos numéricos)
      
      return sqlFiles;
    } catch (error) {
      logger.error('Error leyendo archivos de migración:', error);
      return [];
    }
  }

  /**
   * Ejecutar una migración específica
   */
  private async executeMigration(filename: string): Promise<void> {
    const filePath = path.join(this.migrationsPath, filename);
    
    try {
      console.log(`📄 Ejecutando migración: ${filename}`);
      logger.info(`📄 Ejecutando migración: ${filename}`);
      
      // Leer contenido del archivo
      const sql = fs.readFileSync(filePath, 'utf-8');
      
      // Limpiar el SQL: remover comentarios de línea completa
      const lines = sql.split('\n');
      const cleanedLines = lines.filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 0 && !trimmed.startsWith('--');
      });
      const cleanedSql = cleanedLines.join('\n');
      
      // Dividir en statements individuales (separados por ;)
      const statements = cleanedSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      console.log(`   📝 Ejecutando ${statements.length} statements...`);
      logger.info(`   📝 Ejecutando ${statements.length} statements...`);
      
      // Ejecutar cada statement
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.trim()) {
          try {
            console.log(`   ⚙️  Statement ${i + 1}/${statements.length}`);
            logger.info(`   ⚙️  Statement ${i + 1}/${statements.length}`);
            await db.raw(statement);
          } catch (stmtError: any) {
            // Si el error es "column already exists", continuar
            if (stmtError.code === 'ER_DUP_FIELDNAME') {
              console.warn(`   ⚠️  Columna ya existe, continuando...`);
              logger.warn(`   ⚠️  Columna ya existe, continuando...`);
              continue;
            }
            throw stmtError;
          }
        }
      }
      
      // Registrar migración como ejecutada
      await db('schema_migrations').insert({
        filename,
        executed_at: new Date()
      });
      
      console.log(`✅ Migración ejecutada exitosamente: ${filename}`);
      logger.info(`✅ Migración ejecutada exitosamente: ${filename}`);
    } catch (error: any) {
      console.error(`❌ Error ejecutando migración ${filename}:`, error);
      logger.error(`❌ Error ejecutando migración ${filename}:`, error);
      throw new Error(`Migración fallida: ${filename} - ${error.message}`);
    }
  }

  /**
   * Ejecutar todas las migraciones pendientes
   */
  async runPendingMigrations(): Promise<void> {
    try {
      console.log('🔄 Iniciando sistema de migraciones...');
      console.log(`📁 Ruta de migraciones: ${this.migrationsPath}`);
      logger.info('🔄 Iniciando sistema de migraciones...');
      logger.info(`📁 Ruta de migraciones: ${this.migrationsPath}`);
      
      // 1. Asegurar que existe la tabla de control
      await this.ensureMigrationsTable();
      
      // 2. Obtener migraciones ejecutadas y disponibles
      const executed = await this.getExecutedMigrations();
      const available = await this.getAvailableMigrations();
      
      console.log(`📊 Migraciones ejecutadas: ${executed.length}`);
      logger.info(`📊 Migraciones ejecutadas: ${executed.length}`);
      if (executed.length > 0) {
        console.log(`   Últimas 3 ejecutadas:`);
        executed.slice(-3).forEach(f => console.log(`   ✓ ${f}`));
      }
      
      console.log(`📊 Migraciones disponibles: ${available.length}`);
      logger.info(`📊 Migraciones disponibles: ${available.length}`);
      if (available.length > 0) {
        console.log(`   Archivos encontrados:`);
        available.forEach(f => console.log(`   📄 ${f}`));
      }
      
      if (available.length === 0) {
        console.warn('⚠️  No hay archivos de migración disponibles');
        console.warn(`   Verificar que existan archivos .sql en: ${this.migrationsPath}`);
        logger.warn('⚠️  No hay archivos de migración disponibles');
        logger.warn(`   Verificar que existan archivos .sql en: ${this.migrationsPath}`);
        return;
      }
      
      // 3. Identificar migraciones pendientes
      const pending = available.filter(f => !executed.includes(f));
      
      if (pending.length === 0) {
        console.log('✅ Todas las migraciones están actualizadas');
        console.log(`📊 Total de migraciones: ${available.length}`);
        logger.info('✅ Todas las migraciones están actualizadas');
        logger.info(`📊 Total de migraciones: ${available.length}`);
        return;
      }
      
      console.log(`🔄 Migraciones pendientes: ${pending.length}`);
      logger.info(`🔄 Migraciones pendientes: ${pending.length}`);
      pending.forEach(f => {
        console.log(`   ⏳ ${f}`);
        logger.info(`   ⏳ ${f}`);
      });
      
      // 4. Ejecutar migraciones pendientes en orden
      for (const migration of pending) {
        await this.executeMigration(migration);
      }
      
      console.log(`✅ Todas las migraciones completadas exitosamente`);
      console.log(`📊 Total ejecutadas: ${executed.length + pending.length}`);
      logger.info(`✅ Todas las migraciones completadas exitosamente`);
      logger.info(`📊 Total ejecutadas: ${executed.length + pending.length}`);
      
    } catch (error: any) {
      console.error('❌ Error crítico en sistema de migraciones:', error);
      logger.error('❌ Error crítico en sistema de migraciones:', error);
      throw error; // Re-lanzar para que el backend no inicie
    }
  }

  /**
   * Obtener estado actual de migraciones
   */
  async getStatus(): Promise<{
    executed: number;
    pending: number;
    total: number;
    lastMigration?: string;
  }> {
    await this.ensureMigrationsTable();
    
    const executed = await this.getExecutedMigrations();
    const available = await this.getAvailableMigrations();
    const pending = available.filter(f => !executed.includes(f));
    
    return {
      executed: executed.length,
      pending: pending.length,
      total: available.length,
      lastMigration: executed[executed.length - 1]
    };
  }

  /**
   * Listar todas las migraciones con su estado
   */
  async listMigrations(): Promise<Array<{
    filename: string;
    status: 'executed' | 'pending';
    executedAt?: Date;
  }>> {
    await this.ensureMigrationsTable();
    
    const executed = await db('schema_migrations')
      .select('filename', 'executed_at')
      .orderBy('id', 'asc');
    
    const available = await this.getAvailableMigrations();
    const executedMap = new Map(executed.map(m => [m.filename, m.executed_at]));
    
    return available.map(filename => ({
      filename,
      status: executedMap.has(filename) ? 'executed' : 'pending',
      executedAt: executedMap.get(filename)
    }));
  }
}

// Exportar instancia singleton
export const migrator = new DatabaseMigrator();

import fs from 'fs';
import path from 'path';
import db from '../config/database';
import logger from '../utils/logger';

export class DatabaseSeeder {
  private seedsPath: string;

  constructor() {
    this.seedsPath = path.join(__dirname, '../../seeds');
  }

  /**
   * Verificar si la base de datos está vacía
   */
  private async isDatabaseEmpty(): Promise<boolean> {
    try {
      // Verificar si hay datos en tablas principales
      const [clientsCount] = await db('clients').count('* as count');
      const [servicesCount] = await db('services').count('* as count');
      const [usersCount] = await db('users').count('* as count');
      
      const isEmpty = 
        Number(clientsCount.count) === 0 &&
        Number(servicesCount.count) === 0 &&
        Number(usersCount.count) === 0;
      
      return isEmpty;
    } catch (error) {
      logger.warn('Error verificando si la BD está vacía:', error);
      return false;
    }
  }

  /**
   * Ejecutar un archivo de seed
   */
  private async executeSeed(filename: string): Promise<void> {
    const filePath = path.join(this.seedsPath, filename);
    
    try {
      logger.info(`🌱 Ejecutando seed: ${filename}`);
      
      const sql = fs.readFileSync(filePath, 'utf-8');
      
      // Dividir en statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      // Ejecutar cada statement
      for (const statement of statements) {
        if (statement.trim()) {
          await db.raw(statement);
        }
      }
      
      logger.info(`✅ Seed ejecutado: ${filename}`);
    } catch (error: any) {
      logger.error(`❌ Error ejecutando seed ${filename}:`, error);
      // No lanzar error, los seeds son opcionales
    }
  }

  /**
   * Ejecutar seeds según el ambiente
   */
  async runSeeds(force: boolean = false): Promise<void> {
    try {
      const isEmpty = await this.isDatabaseEmpty();
      
      if (!isEmpty && !force) {
        logger.info('ℹ️  Base de datos ya tiene datos, omitiendo seeds');
        return;
      }

      if (!fs.existsSync(this.seedsPath)) {
        logger.info('ℹ️  No hay carpeta de seeds');
        return;
      }

      const isProduction = process.env.NODE_ENV === 'production';
      
      logger.info('🌱 Ejecutando seeds...');
      
      if (isProduction) {
        // En producción: solo datos mínimos necesarios
        const productionSeeds = [
          'production_base.sql'
        ];
        
        for (const seed of productionSeeds) {
          const seedPath = path.join(this.seedsPath, seed);
          if (fs.existsSync(seedPath)) {
            await this.executeSeed(seed);
          }
        }
      } else {
        // En desarrollo: todos los seeds
        const files = fs.readdirSync(this.seedsPath);
        const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();
        
        for (const seed of sqlFiles) {
          await this.executeSeed(seed);
        }
      }
      
      logger.info('✅ Seeds completados');
      
    } catch (error) {
      logger.error('Error ejecutando seeds:', error);
      // No lanzar error, los seeds son opcionales
    }
  }
}

// Exportar instancia singleton
export const seeder = new DatabaseSeeder();

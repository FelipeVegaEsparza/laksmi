#!/usr/bin/env node
/**
 * Script para ejecutar migraciones SQL
 * Uso: node dist/scripts/run-migrations.js
 */

import { migrator } from '../database/migrator';
import logger from '../utils/logger';

async function runMigrations() {
  try {
    logger.info('🚀 Iniciando ejecución de migraciones...');
    await migrator.runPendingMigrations();
    logger.info('✅ Migraciones completadas exitosamente');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error ejecutando migraciones:', error);
    process.exit(1);
  }
}

runMigrations();

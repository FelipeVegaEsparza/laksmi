#!/usr/bin/env node
/**
 * Script para ejecutar migraciones SQL
 * Uso: node dist/scripts/run-migrations.js
 */

import { migrator } from '../database/migrator';
import logger from '../utils/logger';

async function runMigrations() {
  try {
    console.log('========================================');
    console.log('🚀 INICIANDO SCRIPT DE MIGRACIONES SQL');
    console.log('========================================');
    logger.info('🚀 Iniciando ejecución de migraciones...');
    
    await migrator.runPendingMigrations();
    
    console.log('========================================');
    console.log('✅ MIGRACIONES SQL COMPLETADAS');
    console.log('========================================');
    logger.info('✅ Migraciones completadas exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('========================================');
    console.error('❌ ERROR EN MIGRACIONES SQL');
    console.error('========================================');
    console.error('Error:', error);
    logger.error('❌ Error ejecutando migraciones:', error);
    process.exit(1);
  }
}

console.log('📍 Script run-migrations.js cargado');
runMigrations();

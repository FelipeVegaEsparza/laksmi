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
    console.log('📍 Verificando migrator...');
    console.log('📍 Migrator type:', typeof migrator);
    console.log('📍 runPendingMigrations type:', typeof migrator.runPendingMigrations);
    
    logger.info('🚀 Iniciando ejecución de migraciones...');
    
    console.log('📍 Llamando a runPendingMigrations...');
    await migrator.runPendingMigrations();
    console.log('📍 runPendingMigrations completado');
    
    console.log('========================================');
    console.log('✅ MIGRACIONES SQL COMPLETADAS');
    console.log('========================================');
    logger.info('✅ Migraciones completadas exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('========================================');
    console.error('❌ ERROR EN MIGRACIONES SQL');
    console.error('========================================');
    console.error('Error completo:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    logger.error('❌ Error ejecutando migraciones:', error);
    process.exit(1);
  }
}

console.log('📍 Script run-migrations.js cargado');
runMigrations();

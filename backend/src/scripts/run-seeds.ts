#!/usr/bin/env node
/**
 * Script para ejecutar seeds
 * Uso: node dist/scripts/run-seeds.js
 */

import { seeder } from '../database/seeder';
import logger from '../utils/logger';

async function runSeeds() {
  try {
    logger.info('🌱 Iniciando ejecución de seeds...');
    await seeder.runSeeds();
    logger.info('✅ Seeds completados exitosamente');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error ejecutando seeds:', error);
    process.exit(1);
  }
}

runSeeds();

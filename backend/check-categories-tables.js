// Script para verificar si las tablas de categorías existen
const knex = require('knex');
require('dotenv').config();

const db = knex({
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  }
});

async function checkTables() {
  try {
    console.log('🔍 Verificando tablas de categorías...\n');
    
    // Verificar si existe service_categories
    const serviceCategories = await db.raw(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = ? 
      AND table_name = 'service_categories'
    `, [process.env.DB_NAME]);
    
    const serviceTableExists = serviceCategories[0][0].count > 0;
    console.log(`📋 Tabla service_categories: ${serviceTableExists ? '✅ EXISTE' : '❌ NO EXISTE'}`);
    
    if (serviceTableExists) {
      const serviceCount = await db('service_categories').count('* as count');
      console.log(`   Registros: ${serviceCount[0].count}`);
      
      // Mostrar algunos registros
      const sampleRecords = await db('service_categories').limit(5);
      console.log('   Muestra de registros:', sampleRecords);
    }
    
    console.log('');
    
    // Verificar si existe product_categories
    const productCategories = await db.raw(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = ? 
      AND table_name = 'product_categories'
    `, [process.env.DB_NAME]);
    
    const productTableExists = productCategories[0][0].count > 0;
    console.log(`📋 Tabla product_categories: ${productTableExists ? '✅ EXISTE' : '❌ NO EXISTE'}`);
    
    if (productTableExists) {
      const productCount = await db('product_categories').count('* as count');
      console.log(`   Registros: ${productCount[0].count}`);
      
      // Mostrar algunos registros
      const sampleRecords = await db('product_categories').limit(5);
      console.log('   Muestra de registros:', sampleRecords);
    }
    
    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.destroy();
  }
}

checkTables();

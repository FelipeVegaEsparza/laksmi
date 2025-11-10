const knex = require('knex');
require('dotenv').config();

async function debugStartup() {
  console.log('🔍 Diagnóstico de inicio del backend...\n');
  
  // 1. Verificar variables de entorno
  console.log('1. Variables de entorno:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   PORT: ${process.env.PORT}`);
  console.log(`   DB_HOST: ${process.env.DB_HOST}`);
  console.log(`   DB_PORT: ${process.env.DB_PORT}`);
  console.log(`   DB_USER: ${process.env.DB_USER}`);
  console.log(`   DB_NAME: ${process.env.DB_NAME}`);
  console.log(`   DB_PASSWORD: ${process.env.DB_PASSWORD ? '[SET]' : '[EMPTY]'}\n`);
  
  // 2. Probar conexión con Knex
  console.log('2. Probando conexión con Knex...');
  
  const knexConfig = {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'clinica_belleza',
      charset: 'utf8mb4'
    },
    pool: {
      min: 2,
      max: 10
    }
  };
  
  let db;
  try {
    db = knex(knexConfig);
    console.log('   ✅ Knex inicializado correctamente');
    
    // 3. Probar consulta
    console.log('3. Probando consulta con Knex...');
    const result = await db.raw('SELECT 1 as test');
    console.log('   ✅ Consulta exitosa:', result[0]);
    
    // 4. Verificar tablas existentes
    console.log('4. Verificando tablas existentes...');
    const tables = await db.raw('SHOW TABLES');
    console.log(`   📊 Tablas encontradas: ${tables[0].length}`);
    tables[0].forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`   - ${tableName}`);
    });
    
    // 5. Verificar tabla de migraciones
    console.log('5. Verificando estado de migraciones...');
    try {
      const migrations = await db('knex_migrations').select('*');
      console.log(`   ✅ Migraciones ejecutadas: ${migrations.length}`);
      migrations.forEach(migration => {
        console.log(`   - ${migration.name} (${migration.batch})`);
      });
    } catch (error) {
      console.log('   ⚠️  Tabla de migraciones no existe - ejecuta: npm run migrate');
    }
    
  } catch (error) {
    console.error('   ❌ Error con Knex:', error.message);
    console.error('   Código:', error.code);
    console.error('   Stack:', error.stack);
  } finally {
    if (db) {
      await db.destroy();
      console.log('\n✅ Conexión cerrada correctamente');
    }
  }
}

debugStartup().catch(console.error);
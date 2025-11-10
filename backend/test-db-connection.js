const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('Probando conexión a MySQL...');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`Port: ${process.env.DB_PORT}`);
    console.log(`User: ${process.env.DB_USER}`);
    console.log(`Database: ${process.env.DB_NAME}`);
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('✅ Conexión exitosa a MySQL!');
    
    // Probar una consulta simple
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Consulta de prueba exitosa:', rows);
    
    await connection.end();
    console.log('✅ Conexión cerrada correctamente');
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.error('Código de error:', error.code);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 Soluciones posibles:');
      console.log('1. Verificar que MySQL esté ejecutándose');
      console.log('2. Verificar el puerto (por defecto 3306)');
      console.log('3. Verificar que el host sea correcto (localhost)');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n🔧 Soluciones posibles:');
      console.log('1. Verificar usuario y contraseña');
      console.log('2. Verificar permisos del usuario');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n🔧 Soluciones posibles:');
      console.log('1. Crear la base de datos: CREATE DATABASE clinica_belleza;');
    }
  }
}

testConnection();
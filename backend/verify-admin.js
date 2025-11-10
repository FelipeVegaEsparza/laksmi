const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyAdmin() {
  let connection;
  
  try {
    console.log('🔍 Verificando usuario administrador...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    // Buscar usuario admin
    const [users] = await connection.execute(`
      SELECT id, username, email, role, is_active, created_at 
      FROM users 
      WHERE username = 'admin'
    `);

    if (users.length > 0) {
      console.log('✅ Usuario administrador encontrado:');
      console.log('   ID:', users[0].id);
      console.log('   Username:', users[0].username);
      console.log('   Email:', users[0].email);
      console.log('   Role:', users[0].role);
      console.log('   Active:', users[0].is_active);
      console.log('   Created:', users[0].created_at);
      console.log('');
      console.log('🎯 Credenciales para el dashboard:');
      console.log('   URL: http://localhost:5173');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    } else {
      console.log('❌ Usuario administrador NO encontrado');
      console.log('💡 Ejecuta: node create-admin.js');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

verifyAdmin();
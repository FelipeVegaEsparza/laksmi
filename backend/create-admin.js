const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function createAdmin() {
  let connection;
  
  try {
    console.log('🔧 Creando usuario administrador...');
    
    // Conectar a la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('✅ Conectado a la base de datos');

    // Verificar si la tabla users existe
    const [tables] = await connection.execute("SHOW TABLES LIKE 'users'");
    if (tables.length === 0) {
      console.log('❌ La tabla users no existe. Ejecuta primero: npm run migrate');
      return;
    }

    // Eliminar usuario admin existente (si existe)
    await connection.execute("DELETE FROM users WHERE username = 'admin'");
    console.log('🗑️  Usuario admin anterior eliminado (si existía)');

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash('admin123', 12);
    console.log('🔐 Contraseña hasheada');

    // Insertar nuevo usuario admin
    const [result] = await connection.execute(`
      INSERT INTO users (username, email, password_hash, role, is_active, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `, ['admin', 'admin@clinica.com', passwordHash, 'admin', true]);

    console.log('✅ Usuario administrador creado exitosamente!');
    console.log('');
    console.log('📋 Credenciales de acceso:');
    console.log('   🌐 URL: http://localhost:5173');
    console.log('   👤 Username: admin');
    console.log('   🔑 Password: admin123');
    console.log('   📧 Email: admin@clinica.com');
    console.log('');

    // Verificar que se creó correctamente
    const [users] = await connection.execute("SELECT username, email, role FROM users WHERE username = 'admin'");
    if (users.length > 0) {
      console.log('✅ Verificación exitosa - Usuario encontrado en la base de datos');
      console.log('   Datos:', users[0]);
    }

  } catch (error) {
    console.error('❌ Error creando usuario administrador:', error.message);
    
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('💡 Solución: Ejecuta las migraciones primero:');
      console.log('   cd backend && npm run migrate');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

createAdmin();
const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkData() {
  let connection;
  
  try {
    console.log('🔍 Verificando datos en la base de datos...\n');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    // Verificar servicios
    console.log('📋 SERVICIOS:');
    const [services] = await connection.execute('SELECT id, name, category, price, is_active FROM services LIMIT 10');
    if (services.length > 0) {
      console.log(`   ✅ Encontrados ${services.length} servicios:`);
      services.forEach(service => {
        console.log(`   - ${service.name} (${service.category}) - $${service.price} - ${service.is_active ? 'Activo' : 'Inactivo'}`);
      });
    } else {
      console.log('   ❌ No hay servicios en la base de datos');
    }

    console.log('\n📦 PRODUCTOS:');
    const [products] = await connection.execute('SELECT id, name, category, price, stock FROM products LIMIT 10');
    if (products.length > 0) {
      console.log(`   ✅ Encontrados ${products.length} productos:`);
      products.forEach(product => {
        console.log(`   - ${product.name} (${product.category}) - $${product.price} - Stock: ${product.stock}`);
      });
    } else {
      console.log('   ❌ No hay productos en la base de datos');
    }

    console.log('\n👥 CLIENTES:');
    const [clients] = await connection.execute('SELECT id, name, phone, email FROM clients LIMIT 5');
    if (clients.length > 0) {
      console.log(`   ✅ Encontrados ${clients.length} clientes:`);
      clients.forEach(client => {
        console.log(`   - ${client.name} (${client.phone}) - ${client.email || 'Sin email'}`);
      });
    } else {
      console.log('   ❌ No hay clientes en la base de datos');
    }

    console.log('\n👤 USUARIOS:');
    const [users] = await connection.execute('SELECT id, username, email, role, is_active FROM users');
    if (users.length > 0) {
      console.log(`   ✅ Encontrados ${users.length} usuarios:`);
      users.forEach(user => {
        console.log(`   - ${user.username} (${user.email}) - ${user.role} - ${user.is_active ? 'Activo' : 'Inactivo'}`);
      });
    } else {
      console.log('   ❌ No hay usuarios en la base de datos');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkData();
const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // Limpiar tabla de usuarios existente
  await knex('users').del();
  
  // Hash de la contraseña 'admin123'
  const passwordHash = await bcrypt.hash('admin123', 12);
  
  // Insertar usuario administrador
  await knex('users').insert([
    {
      username: 'admin',
      email: 'admin@clinica.com',
      password_hash: passwordHash,
      role: 'admin',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
  
  console.log('✅ Usuario administrador creado:');
  console.log('   Username: admin');
  console.log('   Password: admin123');
  console.log('   Email: admin@clinica.com');
};
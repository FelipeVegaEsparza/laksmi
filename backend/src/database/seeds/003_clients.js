const { v4: uuidv4 } = require('uuid');

exports.seed = async function(knex) {
  // Limpiar tabla existente
  await knex('clients').del();

  // Clientes de ejemplo
  const clients = [
    {
      id: uuidv4(),
      phone: '+34600123456',
      name: 'María García López',
      email: 'maria.garcia@email.com',
      allergies: JSON.stringify(['Níquel', 'Parabenos']),
      preferences: JSON.stringify(['Productos naturales', 'Tratamientos suaves']),
      loyalty_points: 150
    },
    {
      id: uuidv4(),
      phone: '+34600234567',
      name: 'Ana Martínez Ruiz',
      email: 'ana.martinez@email.com',
      allergies: JSON.stringify([]),
      preferences: JSON.stringify(['Tratamientos anti-edad', 'Masajes relajantes']),
      loyalty_points: 75
    },
    {
      id: uuidv4(),
      phone: '+34600345678',
      name: 'Carmen Rodríguez Sánchez',
      email: 'carmen.rodriguez@email.com',
      allergies: JSON.stringify(['Fragancias fuertes']),
      preferences: JSON.stringify(['Tratamientos faciales', 'Productos hipoalergénicos']),
      loyalty_points: 200
    },
    {
      id: uuidv4(),
      phone: '+34600456789',
      name: 'Isabel López Fernández',
      email: 'isabel.lopez@email.com',
      allergies: JSON.stringify([]),
      preferences: JSON.stringify(['Spa completo', 'Aromaterapia']),
      loyalty_points: 50
    },
    {
      id: uuidv4(),
      phone: '+34600567890',
      name: 'Laura Sánchez Moreno',
      email: 'laura.sanchez@email.com',
      allergies: JSON.stringify(['Ácido salicílico']),
      preferences: JSON.stringify(['Tratamientos corporales', 'Exfoliación suave']),
      loyalty_points: 125
    }
  ];

  // Insertar clientes
  await knex('clients').insert(clients);

  console.log(`Inserted ${clients.length} clients`);
};
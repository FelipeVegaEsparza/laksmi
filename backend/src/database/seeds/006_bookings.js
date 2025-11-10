const { v4: uuidv4 } = require('uuid');

exports.seed = async function(knex) {
  // Limpiar tabla existente
  await knex('bookings').del();

  // Obtener algunos clientes, servicios y profesionales para crear citas de ejemplo
  const clients = await knex('clients').select('id').limit(3);
  const services = await knex('services').select('id', 'duration').limit(5);
  const professionals = await knex('professionals').select('id').where('is_active', true).limit(3);
  
  if (clients.length === 0 || services.length === 0 || professionals.length === 0) {
    console.log('No hay suficientes datos base, saltando creación de citas');
    return;
  }

  // Crear citas de ejemplo para los próximos días
  const bookings = [];
  const now = new Date();
  
  // Citas para hoy
  const today = new Date(now);
  today.setHours(10, 0, 0, 0);
  
  bookings.push({
    id: uuidv4(),
    client_id: clients[0].id,
    service_id: services[0].id,
    professional_id: professionals[0].id,
    date_time: new Date(today),
    duration: services[0].duration,
    status: 'confirmed',
    notes: 'Primera cita del cliente'
  });

  // Cita completada (ayer)
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(14, 30, 0, 0);
  
  bookings.push({
    id: uuidv4(),
    client_id: clients[1].id,
    service_id: services[1].id,
    professional_id: professionals[1].id,
    date_time: new Date(yesterday),
    duration: services[1].duration,
    status: 'completed',
    notes: 'Tratamiento completado satisfactoriamente'
  });

  // Citas futuras
  for (let i = 1; i <= 7; i++) {
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + i);
    futureDate.setHours(9 + (i % 8), (i % 2) * 30, 0, 0);
    
    bookings.push({
      id: uuidv4(),
      client_id: clients[i % clients.length].id,
      service_id: services[i % services.length].id,
      professional_id: professionals[i % professionals.length].id,
      date_time: new Date(futureDate),
      duration: services[i % services.length].duration,
      status: 'confirmed',
      notes: `Cita programada ${i}`
    });
  }

  // Cita cancelada
  const cancelledDate = new Date(now);
  cancelledDate.setDate(cancelledDate.getDate() + 3);
  cancelledDate.setHours(16, 0, 0, 0);
  
  bookings.push({
    id: uuidv4(),
    client_id: clients[2].id,
    service_id: services[2].id,
    professional_id: professionals[2].id,
    date_time: new Date(cancelledDate),
    duration: services[2].duration,
    status: 'cancelled',
    notes: 'Cancelada por el cliente'
  });

  // Insertar citas
  await knex('bookings').insert(bookings);

  console.log(`Inserted ${bookings.length} bookings`);
};
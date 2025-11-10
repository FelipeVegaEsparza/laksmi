const { v4: uuidv4 } = require('uuid');

exports.seed = async function(knex) {
  // Limpiar tabla existente
  await knex('professionals').del();

  // Obtener algunos servicios para asignar como especialidades
  const services = await knex('services').select('id', 'category').limit(10);
  
  if (services.length === 0) {
    console.log('No services found, skipping professionals seed');
    return;
  }

  // Horario de trabajo estándar
  const standardSchedule = {
    monday: {
      isWorking: true,
      shifts: [{ startTime: '09:00', endTime: '18:00' }]
    },
    tuesday: {
      isWorking: true,
      shifts: [{ startTime: '09:00', endTime: '18:00' }]
    },
    wednesday: {
      isWorking: true,
      shifts: [{ startTime: '09:00', endTime: '18:00' }]
    },
    thursday: {
      isWorking: true,
      shifts: [{ startTime: '09:00', endTime: '18:00' }]
    },
    friday: {
      isWorking: true,
      shifts: [{ startTime: '09:00', endTime: '18:00' }]
    },
    saturday: {
      isWorking: true,
      shifts: [{ startTime: '09:00', endTime: '16:00' }]
    },
    sunday: {
      isWorking: false,
      shifts: []
    }
  };

  // Horario de trabajo de medio tiempo
  const partTimeSchedule = {
    monday: {
      isWorking: true,
      shifts: [{ startTime: '14:00', endTime: '20:00' }]
    },
    tuesday: {
      isWorking: false,
      shifts: []
    },
    wednesday: {
      isWorking: true,
      shifts: [{ startTime: '14:00', endTime: '20:00' }]
    },
    thursday: {
      isWorking: false,
      shifts: []
    },
    friday: {
      isWorking: true,
      shifts: [{ startTime: '14:00', endTime: '20:00' }]
    },
    saturday: {
      isWorking: true,
      shifts: [{ startTime: '10:00', endTime: '18:00' }]
    },
    sunday: {
      isWorking: false,
      shifts: []
    }
  };

  // Crear profesionales de ejemplo
  const professionals = [
    {
      id: uuidv4(),
      name: 'María González',
      specialties: JSON.stringify(services.filter(s => s.category === 'Facial').map(s => s.id).slice(0, 3)),
      schedule: JSON.stringify(standardSchedule),
      is_active: true
    },
    {
      id: uuidv4(),
      name: 'Ana Rodríguez',
      specialties: JSON.stringify(services.filter(s => s.category === 'Corporal').map(s => s.id).slice(0, 2)),
      schedule: JSON.stringify(standardSchedule),
      is_active: true
    },
    {
      id: uuidv4(),
      name: 'Carmen López',
      specialties: JSON.stringify(services.filter(s => s.category === 'Spa').map(s => s.id).slice(0, 4)),
      schedule: JSON.stringify(partTimeSchedule),
      is_active: true
    },
    {
      id: uuidv4(),
      name: 'Isabel Martín',
      specialties: JSON.stringify(services.map(s => s.id).slice(0, 2)), // Servicios generales
      schedule: JSON.stringify(standardSchedule),
      is_active: true
    },
    {
      id: uuidv4(),
      name: 'Laura Sánchez',
      specialties: JSON.stringify(services.filter(s => s.category === 'Facial' || s.category === 'Spa').map(s => s.id).slice(0, 3)),
      schedule: JSON.stringify({
        ...standardSchedule,
        sunday: {
          isWorking: true,
          shifts: [{ startTime: '10:00', endTime: '14:00' }]
        }
      }),
      is_active: false // Profesional inactivo para pruebas
    }
  ];

  // Insertar profesionales
  await knex('professionals').insert(professionals);

  console.log(`Inserted ${professionals.length} professionals`);
};
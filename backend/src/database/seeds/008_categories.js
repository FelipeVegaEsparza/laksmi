exports.seed = async function(knex) {
  // Eliminar categorías existentes
  await knex('categories').del();

  // Insertar categorías de servicios
  await knex('categories').insert([
    {
      name: 'Facial',
      type: 'service',
      description: 'Tratamientos faciales y cuidado de la piel del rostro',
      is_active: true
    },
    {
      name: 'Corporal',
      type: 'service',
      description: 'Tratamientos corporales y masajes',
      is_active: true
    },
    {
      name: 'Manos y Pies',
      type: 'service',
      description: 'Manicura, pedicura y cuidado de manos y pies',
      is_active: true
    },
    {
      name: 'Spa',
      type: 'service',
      description: 'Experiencias de relajación y bienestar',
      is_active: true
    },
    {
      name: 'Consultoría',
      type: 'service',
      description: 'Asesoramiento personalizado de belleza',
      is_active: true
    }
  ]);

  // Insertar categorías de productos
  await knex('categories').insert([
    {
      name: 'Cuidado Facial',
      type: 'product',
      description: 'Productos para el cuidado del rostro',
      is_active: true
    },
    {
      name: 'Cuidado Corporal',
      type: 'product',
      description: 'Productos para el cuidado del cuerpo',
      is_active: true
    },
    {
      name: 'Mascarillas',
      type: 'product',
      description: 'Mascarillas faciales y corporales',
      is_active: true
    },
    {
      name: 'Exfoliantes',
      type: 'product',
      description: 'Exfoliantes y scrubs',
      is_active: true
    },
    {
      name: 'Limpieza',
      type: 'product',
      description: 'Productos de limpieza facial y corporal',
      is_active: true
    },
    {
      name: 'Protección Solar',
      type: 'product',
      description: 'Protectores solares y after sun',
      is_active: true
    },
    {
      name: 'Tratamientos Intensivos',
      type: 'product',
      description: 'Ampollas, sérums y tratamientos concentrados',
      is_active: true
    }
  ]);
};

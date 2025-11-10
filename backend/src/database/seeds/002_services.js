const { v4: uuidv4 } = require('uuid');

exports.seed = async function(knex) {
  // Limpiar tabla existente
  await knex('services').del();

  // Servicios de ejemplo para clínica de belleza
  const services = [
    // Servicios Faciales
    {
      id: uuidv4(),
      name: 'Limpieza Facial Profunda',
      category: 'Facial',
      price: 45.00,
      duration: 60,
      description: 'Limpieza profunda con extracción de comedones, mascarilla purificante y hidratación.',
      images: JSON.stringify([
        'https://example.com/images/limpieza-facial.jpg'
      ]),
      requirements: JSON.stringify([
        'No usar productos exfoliantes 24h antes',
        'Informar sobre alergias conocidas'
      ]),
      is_active: true
    },
    {
      id: uuidv4(),
      name: 'Tratamiento Anti-Edad',
      category: 'Facial',
      price: 75.00,
      duration: 90,
      description: 'Tratamiento completo con ácido hialurónico, radiofrecuencia y mascarilla reafirmante.',
      images: JSON.stringify([
        'https://example.com/images/anti-edad.jpg'
      ]),
      requirements: JSON.stringify([
        'Consulta previa requerida',
        'No estar embarazada'
      ]),
      is_active: true
    },
    {
      id: uuidv4(),
      name: 'Hidratación Facial',
      category: 'Facial',
      price: 35.00,
      duration: 45,
      description: 'Tratamiento hidratante intensivo con mascarilla de colágeno y suero vitamínico.',
      images: JSON.stringify([]),
      requirements: JSON.stringify([]),
      is_active: true
    },

    // Servicios Corporales
    {
      id: uuidv4(),
      name: 'Masaje Relajante',
      category: 'Corporal',
      price: 50.00,
      duration: 60,
      description: 'Masaje corporal completo con aceites esenciales para relajación profunda.',
      images: JSON.stringify([
        'https://example.com/images/masaje-relajante.jpg'
      ]),
      requirements: JSON.stringify([
        'Informar sobre lesiones o dolores',
        'No comer 2 horas antes'
      ]),
      is_active: true
    },
    {
      id: uuidv4(),
      name: 'Exfoliación Corporal',
      category: 'Corporal',
      price: 40.00,
      duration: 45,
      description: 'Exfoliación completa con sales marinas y hidratación posterior.',
      images: JSON.stringify([]),
      requirements: JSON.stringify([
        'No tener heridas abiertas',
        'Evitar exposición solar 24h después'
      ]),
      is_active: true
    },
    {
      id: uuidv4(),
      name: 'Tratamiento Reductivo',
      category: 'Corporal',
      price: 65.00,
      duration: 75,
      description: 'Tratamiento con cavitación y radiofrecuencia para reducción de medidas.',
      images: JSON.stringify([
        'https://example.com/images/reductivo.jpg'
      ]),
      requirements: JSON.stringify([
        'Consulta médica previa',
        'No estar embarazada',
        'No tener marcapasos'
      ]),
      is_active: true
    },

    // Servicios de Spa
    {
      id: uuidv4(),
      name: 'Ritual de Relajación',
      category: 'Spa',
      price: 85.00,
      duration: 120,
      description: 'Experiencia completa: sauna, masaje, facial y aromaterapia.',
      images: JSON.stringify([
        'https://example.com/images/ritual-spa.jpg'
      ]),
      requirements: JSON.stringify([
        'Reservar con 48h de anticipación',
        'Traer ropa cómoda'
      ]),
      is_active: true
    },
    {
      id: uuidv4(),
      name: 'Envoltura Corporal',
      category: 'Spa',
      price: 55.00,
      duration: 90,
      description: 'Envoltura desintoxicante con algas marinas y arcilla volcánica.',
      images: JSON.stringify([]),
      requirements: JSON.stringify([
        'No tener claustrofobia',
        'Hidratarse bien antes y después'
      ]),
      is_active: true
    },
    {
      id: uuidv4(),
      name: 'Reflexología',
      category: 'Spa',
      price: 30.00,
      duration: 30,
      description: 'Masaje terapéutico en pies para equilibrar la energía corporal.',
      images: JSON.stringify([]),
      requirements: JSON.stringify([
        'No tener heridas en los pies'
      ]),
      is_active: true
    },

    // Servicios de Manicura/Pedicura
    {
      id: uuidv4(),
      name: 'Manicura Completa',
      category: 'Manos y Pies',
      price: 25.00,
      duration: 45,
      description: 'Manicura con limado, cutícula, exfoliación y esmaltado.',
      images: JSON.stringify([]),
      requirements: JSON.stringify([]),
      is_active: true
    },
    {
      id: uuidv4(),
      name: 'Pedicura Spa',
      category: 'Manos y Pies',
      price: 35.00,
      duration: 60,
      description: 'Pedicura completa con baño de pies, exfoliación y masaje.',
      images: JSON.stringify([]),
      requirements: JSON.stringify([
        'No tener infecciones en los pies'
      ]),
      is_active: true
    },

    // Servicios Especiales
    {
      id: uuidv4(),
      name: 'Consulta Personalizada',
      category: 'Consultoría',
      price: 20.00,
      duration: 30,
      description: 'Evaluación de piel y recomendación de tratamientos personalizados.',
      images: JSON.stringify([]),
      requirements: JSON.stringify([
        'Traer productos actuales que usa'
      ]),
      is_active: true
    }
  ];

  // Insertar servicios
  await knex('services').insert(services);

  console.log(`Inserted ${services.length} services`);
};
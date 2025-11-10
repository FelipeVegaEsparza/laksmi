exports.seed = async function(knex) {
  // Limpiar tabla existente
  await knex('products').del();

  // Insertar productos de ejemplo
  await knex('products').insert([
    {
      id: knex.raw('(UUID())'),
      name: 'Crema Hidratante Facial Premium',
      category: 'Cuidado Facial',
      price: 45.99,
      stock: 25,
      min_stock: 5,
      description: 'Crema hidratante de alta calidad con ingredientes naturales para todo tipo de piel. Proporciona hidratación profunda y duradera.',
      images: JSON.stringify(['/images/products/crema-hidratante.jpg']),
      ingredients: JSON.stringify(['Ácido Hialurónico', 'Vitamina E', 'Colágeno', 'Aloe Vera']),
      compatible_services: JSON.stringify(['facial-hidratante', 'limpieza-facial'])
    },
    {
      id: knex.raw('(UUID())'),
      name: 'Sérum Anti-Edad con Retinol',
      category: 'Cuidado Facial',
      price: 89.99,
      stock: 15,
      min_stock: 3,
      description: 'Sérum concentrado con retinol para combatir los signos del envejecimiento. Reduce arrugas y mejora la textura de la piel.',
      images: JSON.stringify(['/images/products/serum-retinol.jpg']),
      ingredients: JSON.stringify(['Retinol', 'Vitamina C', 'Péptidos', 'Niacinamida']),
      compatible_services: JSON.stringify(['tratamiento-anti-edad', 'facial-rejuvenecedor'])
    },
    {
      id: knex.raw('(UUID())'),
      name: 'Mascarilla Purificante de Arcilla',
      category: 'Mascarillas',
      price: 32.50,
      stock: 40,
      min_stock: 8,
      description: 'Mascarilla purificante con arcilla natural que elimina impurezas y controla el exceso de grasa.',
      images: JSON.stringify(['/images/products/mascarilla-arcilla.jpg']),
      ingredients: JSON.stringify(['Arcilla Bentonita', 'Carbón Activado', 'Té Verde', 'Menta']),
      compatible_services: JSON.stringify(['limpieza-profunda', 'tratamiento-acne'])
    },
    {
      id: knex.raw('(UUID())'),
      name: 'Aceite Corporal Relajante',
      category: 'Cuidado Corporal',
      price: 28.75,
      stock: 30,
      min_stock: 6,
      description: 'Aceite corporal con aromas relajantes para masajes y cuidado diario de la piel.',
      images: JSON.stringify(['/images/products/aceite-corporal.jpg']),
      ingredients: JSON.stringify(['Aceite de Jojoba', 'Lavanda', 'Manzanilla', 'Vitamina E']),
      compatible_services: JSON.stringify(['masaje-relajante', 'tratamiento-corporal'])
    },
    {
      id: knex.raw('(UUID())'),
      name: 'Exfoliante Corporal de Azúcar',
      category: 'Exfoliantes',
      price: 24.99,
      stock: 20,
      min_stock: 4,
      description: 'Exfoliante natural con azúcar moreno que elimina células muertas y suaviza la piel.',
      images: JSON.stringify(['/images/products/exfoliante-azucar.jpg']),
      ingredients: JSON.stringify(['Azúcar Moreno', 'Aceite de Coco', 'Vainilla', 'Sal Marina']),
      compatible_services: JSON.stringify(['exfoliacion-corporal', 'preparacion-bronceado'])
    },
    {
      id: knex.raw('(UUID())'),
      name: 'Tónico Facial Equilibrante',
      category: 'Cuidado Facial',
      price: 19.99,
      stock: 35,
      min_stock: 7,
      description: 'Tónico equilibrante que prepara la piel para tratamientos posteriores y mantiene el pH natural.',
      images: JSON.stringify(['/images/products/tonico-facial.jpg']),
      ingredients: JSON.stringify(['Agua de Rosas', 'Hamamelis', 'Glicerina', 'Ácido Salicílico']),
      compatible_services: JSON.stringify(['limpieza-facial', 'tratamiento-acne'])
    },
    {
      id: knex.raw('(UUID())'),
      name: 'Crema Reafirmante Corporal',
      category: 'Cuidado Corporal',
      price: 52.00,
      stock: 12,
      min_stock: 3,
      description: 'Crema reafirmante con cafeína que mejora la elasticidad y firmeza de la piel corporal.',
      images: JSON.stringify(['/images/products/crema-reafirmante.jpg']),
      ingredients: JSON.stringify(['Cafeína', 'Centella Asiática', 'Colágeno Marino', 'Elastina']),
      compatible_services: JSON.stringify(['tratamiento-reafirmante', 'masaje-modelador'])
    },
    {
      id: knex.raw('(UUID())'),
      name: 'Protector Solar Facial SPF 50',
      category: 'Protección Solar',
      price: 35.50,
      stock: 50,
      min_stock: 10,
      description: 'Protector solar facial de amplio espectro con ingredientes naturales y textura ligera.',
      images: JSON.stringify(['/images/products/protector-solar.jpg']),
      ingredients: JSON.stringify(['Óxido de Zinc', 'Titanio', 'Vitamina E', 'Aloe Vera']),
      compatible_services: JSON.stringify(['facial-hidratante', 'preparacion-verano'])
    },
    {
      id: knex.raw('(UUID())'),
      name: 'Gel Limpiador Suave',
      category: 'Limpieza',
      price: 16.75,
      stock: 45,
      min_stock: 9,
      description: 'Gel limpiador suave para uso diario que respeta el equilibrio natural de la piel.',
      images: JSON.stringify(['/images/products/gel-limpiador.jpg']),
      ingredients: JSON.stringify(['Glicerina', 'Manzanilla', 'Aloe Vera', 'Pantenol']),
      compatible_services: JSON.stringify(['limpieza-facial', 'cuidado-diario'])
    },
    {
      id: knex.raw('(UUID())'),
      name: 'Ampolla Vitamina C Intensiva',
      category: 'Tratamientos Intensivos',
      price: 12.99,
      stock: 8,
      min_stock: 15,
      description: 'Ampolla concentrada de vitamina C para tratamientos intensivos anti-manchas y luminosidad.',
      images: JSON.stringify(['/images/products/ampolla-vitamina-c.jpg']),
      ingredients: JSON.stringify(['Vitamina C Pura', 'Ácido Ferúlico', 'Vitamina E', 'Agua Destilada']),
      compatible_services: JSON.stringify(['facial-vitamina-c', 'tratamiento-manchas'])
    }
  ]);
};
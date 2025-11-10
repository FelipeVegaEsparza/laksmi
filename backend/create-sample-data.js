const mysql = require('mysql2/promise');
require('dotenv').config();

async function createSampleData() {
  let connection;
  
  try {
    console.log('🎯 Creando datos de muestra...\n');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    // Limpiar datos existentes (opcional)
    console.log('🗑️  Limpiando datos existentes...');
    await connection.execute('DELETE FROM services');
    await connection.execute('DELETE FROM products');

    // Crear servicios de muestra
    console.log('💅 Creando servicios de muestra...');
    const services = [
      {
        name: 'Limpieza Facial Profunda',
        category: 'facial',
        price: 85.00,
        duration: 60,
        description: 'Tratamiento completo de limpieza facial con extracción de impurezas y mascarilla hidratante.',
        images: JSON.stringify(['/images/facial-cleaning.jpg']),
        requirements: JSON.stringify(['No usar retinol 48h antes']),
        is_active: true
      },
      {
        name: 'Masaje Relajante Corporal',
        category: 'corporal',
        price: 120.00,
        duration: 90,
        description: 'Masaje corporal completo con aceites esenciales para relajación profunda.',
        images: JSON.stringify(['/images/body-massage.jpg']),
        requirements: JSON.stringify([]),
        is_active: true
      },
      {
        name: 'Tratamiento Anti-Edad',
        category: 'facial',
        price: 150.00,
        duration: 75,
        description: 'Tratamiento facial avanzado con tecnología de radiofrecuencia para combatir signos de envejecimiento.',
        images: JSON.stringify(['/images/anti-aging.jpg']),
        requirements: JSON.stringify(['Consulta previa requerida']),
        is_active: true
      },
      {
        name: 'Depilación Láser',
        category: 'estetica',
        price: 200.00,
        duration: 45,
        description: 'Depilación láser definitiva con tecnología de última generación.',
        images: JSON.stringify(['/images/laser-hair.jpg']),
        requirements: JSON.stringify(['No exposición solar 2 semanas antes']),
        is_active: true
      },
      {
        name: 'Spa Day Completo',
        category: 'spa',
        price: 300.00,
        duration: 180,
        description: 'Día completo de relajación con masaje, facial, manicure y pedicure.',
        images: JSON.stringify(['/images/spa-day.jpg']),
        requirements: JSON.stringify([]),
        is_active: true
      }
    ];

    for (const service of services) {
      await connection.execute(`
        INSERT INTO services (name, category, price, duration, description, images, requirements, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        service.name,
        service.category,
        service.price,
        service.duration,
        service.description,
        service.images,
        service.requirements,
        service.is_active
      ]);
      console.log(`   ✅ ${service.name} - $${service.price}`);
    }

    // Crear productos de muestra
    console.log('\n📦 Creando productos de muestra...');
    const products = [
      {
        name: 'Crema Hidratante Premium',
        category: 'cuidado-facial',
        price: 45.00,
        stock: 25,
        min_stock: 5,
        ingredients: JSON.stringify(['Ácido Hialurónico', 'Vitamina E', 'Colágeno']),
        compatible_services: JSON.stringify(['facial'])
      },
      {
        name: 'Sérum Anti-Edad',
        category: 'cuidado-facial',
        price: 65.00,
        stock: 15,
        min_stock: 3,
        ingredients: JSON.stringify(['Retinol', 'Vitamina C', 'Péptidos']),
        compatible_services: JSON.stringify(['facial', 'estetica'])
      },
      {
        name: 'Aceite Corporal Relajante',
        category: 'cuidado-corporal',
        price: 35.00,
        stock: 30,
        min_stock: 8,
        ingredients: JSON.stringify(['Aceite de Lavanda', 'Aceite de Almendras', 'Vitamina E']),
        compatible_services: JSON.stringify(['corporal', 'spa'])
      },
      {
        name: 'Mascarilla Purificante',
        category: 'cuidado-facial',
        price: 25.00,
        stock: 40,
        min_stock: 10,
        ingredients: JSON.stringify(['Arcilla Verde', 'Carbón Activado', 'Aloe Vera']),
        compatible_services: JSON.stringify(['facial'])
      },
      {
        name: 'Kit de Manicure Premium',
        category: 'herramientas',
        price: 85.00,
        stock: 12,
        min_stock: 3,
        ingredients: JSON.stringify(['Acero Inoxidable', 'Esmaltes Premium']),
        compatible_services: JSON.stringify(['spa'])
      }
    ];

    for (const product of products) {
      await connection.execute(`
        INSERT INTO products (name, category, price, stock, min_stock, ingredients, compatible_services, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        product.name,
        product.category,
        product.price,
        product.stock,
        product.min_stock,
        product.ingredients,
        product.compatible_services
      ]);
      console.log(`   ✅ ${product.name} - $${product.price} (Stock: ${product.stock})`);
    }

    console.log('\n🎉 ¡Datos de muestra creados exitosamente!');
    console.log('\n📋 Resumen:');
    console.log(`   💅 ${services.length} servicios creados`);
    console.log(`   📦 ${products.length} productos creados`);
    console.log('\n🌐 Ahora puedes ver los datos en:');
    console.log('   Dashboard: http://localhost:5173');
    console.log('   Frontend: http://localhost:3001');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createSampleData();
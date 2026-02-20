const mysql = require('mysql2/promise');
const { generateSlug } = require('./populate-service-slugs');
require('dotenv').config();

async function populateProductSlugs() {
  let connection;
  
  try {
    console.log('🔄 Conectando a la base de datos...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'clinica_belleza'
    });

    console.log('✅ Conectado a la base de datos');

    // Obtener todos los productos
    const [products] = await connection.execute(
      'SELECT id, name, slug FROM products ORDER BY name'
    );

    console.log(`📋 Encontrados ${products.length} productos`);

    const slugCounts = {};
    let updated = 0;
    let skipped = 0;

    for (const product of products) {
      // Si ya tiene slug, saltar
      if (product.slug) {
        console.log(`⏭️  Producto "${product.name}" ya tiene slug: ${product.slug}`);
        skipped++;
        continue;
      }

      // Generar slug base
      let slug = generateSlug(product.name);
      
      // Manejar duplicados
      if (slugCounts[slug]) {
        slugCounts[slug]++;
        slug = `${slug}-${slugCounts[slug]}`;
      } else {
        slugCounts[slug] = 1;
      }

      // Actualizar producto
      await connection.execute(
        'UPDATE products SET slug = ? WHERE id = ?',
        [slug, product.id]
      );

      console.log(`✅ "${product.name}" → ${slug}`);
      updated++;
    }

    // Hacer la columna NOT NULL ahora que todos tienen slug
    console.log('\n🔒 Haciendo columna slug obligatoria...');
    await connection.execute(
      'ALTER TABLE products MODIFY COLUMN slug VARCHAR(255) NOT NULL'
    );

    console.log('\n✅ Proceso completado:');
    console.log(`   - Productos actualizados: ${updated}`);
    console.log(`   - Productos omitidos (ya tenían slug): ${skipped}`);
    console.log(`   - Total: ${products.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  populateProductSlugs()
    .then(() => {
      console.log('\n🎉 Script ejecutado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { populateProductSlugs };

const mysql = require('mysql2/promise');
require('dotenv').config();

// Función para generar slug desde texto
function generateSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    // Reemplazar caracteres con tildes
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Reemplazar ñ con n
    .replace(/ñ/g, 'n')
    // Reemplazar espacios y caracteres especiales con guiones
    .replace(/[^a-z0-9]+/g, '-')
    // Eliminar guiones al inicio y final
    .replace(/^-+|-+$/g, '')
    // Reemplazar múltiples guiones con uno solo
    .replace(/-+/g, '-');
}

async function populateServiceSlugs() {
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

    // Obtener todos los servicios
    const [services] = await connection.execute(
      'SELECT id, name, slug FROM services ORDER BY name'
    );

    console.log(`📋 Encontrados ${services.length} servicios`);

    const slugCounts = {};
    let updated = 0;
    let skipped = 0;

    for (const service of services) {
      // Si ya tiene slug, saltar
      if (service.slug) {
        console.log(`⏭️  Servicio "${service.name}" ya tiene slug: ${service.slug}`);
        skipped++;
        continue;
      }

      // Generar slug base
      let slug = generateSlug(service.name);
      
      // Manejar duplicados
      if (slugCounts[slug]) {
        slugCounts[slug]++;
        slug = `${slug}-${slugCounts[slug]}`;
      } else {
        slugCounts[slug] = 1;
      }

      // Actualizar servicio
      await connection.execute(
        'UPDATE services SET slug = ? WHERE id = ?',
        [slug, service.id]
      );

      console.log(`✅ "${service.name}" → ${slug}`);
      updated++;
    }

    // Hacer la columna NOT NULL ahora que todos tienen slug
    console.log('\n🔒 Haciendo columna slug obligatoria...');
    await connection.execute(
      'ALTER TABLE services MODIFY COLUMN slug VARCHAR(255) NOT NULL'
    );

    console.log('\n✅ Proceso completado:');
    console.log(`   - Servicios actualizados: ${updated}`);
    console.log(`   - Servicios omitidos (ya tenían slug): ${skipped}`);
    console.log(`   - Total: ${services.length}`);

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
  populateServiceSlugs()
    .then(() => {
      console.log('\n🎉 Script ejecutado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { populateServiceSlugs, generateSlug };

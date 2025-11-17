/**
 * Script para eliminar categorías duplicadas/obsoletas
 * 
 * Uso: node backend/scripts/update-category-names.js
 */

require('dotenv').config({ path: './backend/scripts/.env.import' });
const axios = require('axios');

const CONFIG = {
  apiUrl: process.env.LAXMI_API_URL,
  authToken: process.env.LAXMI_AUTH_TOKEN,
};

// Categorías a eliminar (las antiguas sin tilde)
const CATEGORIES_TO_DELETE = [
  'Depilación Laser Hombre',
  'Depilación Laser Mujer',
];

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🗑️  ELIMINANDO CATEGORÍAS OBSOLETAS');
  console.log('='.repeat(60) + '\n');

  try {
    // 1. Obtener todas las categorías
    console.log('📥 Obteniendo categorías...');
    const response = await axios.get(
      `${CONFIG.apiUrl}/api/v1/categories?type=service`,
      {
        headers: {
          'Authorization': `Bearer ${CONFIG.authToken}`,
        },
      }
    );

    const categories = response.data.data || response.data || [];
    console.log(`✅ Total de categorías: ${categories.length}\n`);

    // 2. Obtener servicios para verificar cuáles categorías están en uso
    console.log('📥 Obteniendo servicios para verificar uso...');
    const servicesResponse = await axios.get(
      `${CONFIG.apiUrl}/api/v1/services?limit=200`,
      {
        headers: {
          'Authorization': `Bearer ${CONFIG.authToken}`,
        },
      }
    );

    const services = servicesResponse.data.data?.services || [];
    const categoriesInUse = new Set(services.map(s => s.category));

    console.log('📊 Categorías en uso por servicios:');
    Array.from(categoriesInUse).sort().forEach(cat => {
      const count = services.filter(s => s.category === cat).length;
      console.log(`  - ${cat}: ${count} servicios`);
    });
    console.log('');

    // 3. Eliminar categorías obsoletas
    let deleted = 0;
    let notFound = 0;
    let skipped = 0;

    for (const categoryName of CATEGORIES_TO_DELETE) {
      const category = categories.find(c => c.name === categoryName);
      
      if (!category) {
        console.log(`⚠️  Categoría "${categoryName}" no encontrada`);
        notFound++;
        continue;
      }

      // Verificar si está en uso
      if (categoriesInUse.has(categoryName)) {
        console.log(`⚠️  Categoría "${categoryName}" aún tiene servicios, no se eliminará`);
        skipped++;
        continue;
      }

      try {
        await axios.delete(
          `${CONFIG.apiUrl}/api/v1/categories/${category.id}`,
          {
            headers: {
              'Authorization': `Bearer ${CONFIG.authToken}`,
            },
          }
        );
        console.log(`✅ Eliminada: "${categoryName}"`);
        deleted++;
      } catch (error) {
        console.log(`❌ Error eliminando "${categoryName}": ${error.message}`);
        if (error.response) {
          console.log(`   Status: ${error.response.status}`);
          console.log(`   Data: ${JSON.stringify(error.response.data)}`);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 4. Resumen
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN');
    console.log('='.repeat(60));
    console.log(`✅ Eliminadas: ${deleted}`);
    if (skipped > 0) {
      console.log(`⚠️  Omitidas (en uso): ${skipped}`);
    }
    if (notFound > 0) {
      console.log(`⚠️  No encontradas: ${notFound}`);
    }
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

main();

/**
 * Script para normalizar nombres de categorías
 * 
 * Corrige inconsistencias como "Laser" vs "Láser"
 * 
 * Uso: node backend/scripts/normalize-categories.js
 */

require('dotenv').config({ path: './backend/scripts/.env.import' });
const axios = require('axios');

const CONFIG = {
  apiUrl: process.env.LAXMI_API_URL,
  authToken: process.env.LAXMI_AUTH_TOKEN,
};

// Mapeo de categorías a normalizar
const CATEGORY_MAPPING = {
  'Depilación Laser Hombre': 'Depilación Láser Hombre',
  'Depilación Laser Mujer': 'Depilación Láser Mujer',
  'Sin categorizar': 'Sin categoría',
};

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🔄 NORMALIZANDO CATEGORÍAS DE SERVICIOS');
  console.log('='.repeat(60) + '\n');

  try {
    // 1. Obtener todos los servicios
    console.log('📥 Obteniendo servicios...');
    const response = await axios.get(
      `${CONFIG.apiUrl}/api/v1/services?limit=200`,
      {
        headers: {
          'Authorization': `Bearer ${CONFIG.authToken}`,
        },
      }
    );

    const services = response.data.data?.services || [];
    console.log(`✅ Total de servicios: ${services.length}\n`);

    // 2. Identificar servicios que necesitan actualización
    const servicesToUpdate = services.filter(s => 
      Object.keys(CATEGORY_MAPPING).includes(s.category)
    );

    console.log(`📊 Servicios a actualizar: ${servicesToUpdate.length}\n`);

    if (servicesToUpdate.length === 0) {
      console.log('✅ No hay servicios que necesiten actualización!');
      return;
    }

    // Mostrar resumen de cambios
    console.log('Cambios a realizar:');
    Object.entries(CATEGORY_MAPPING).forEach(([oldCat, newCat]) => {
      const count = servicesToUpdate.filter(s => s.category === oldCat).length;
      if (count > 0) {
        console.log(`  "${oldCat}" → "${newCat}" (${count} servicios)`);
      }
    });
    console.log('');

    // 3. Actualizar cada servicio
    let updated = 0;
    let failed = 0;

    for (const service of servicesToUpdate) {
      const newCategory = CATEGORY_MAPPING[service.category];
      
      try {
        await axios.put(
          `${CONFIG.apiUrl}/api/v1/services/${service.id}`,
          { category: newCategory },
          {
            headers: {
              'Authorization': `Bearer ${CONFIG.authToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        console.log(`✅ "${service.name}": ${service.category} → ${newCategory}`);
        updated++;
      } catch (error) {
        console.log(`❌ Error actualizando "${service.name}": ${error.message}`);
        failed++;
      }

      // Pequeña pausa para no saturar el servidor
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 4. Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN');
    console.log('='.repeat(60));
    console.log(`✅ Actualizados: ${updated}`);
    if (failed > 0) {
      console.log(`❌ Fallidos: ${failed}`);
    }
    
    // Mostrar categorías finales
    console.log('\n📋 Categorías después de la normalización:');
    const finalResponse = await axios.get(
      `${CONFIG.apiUrl}/api/v1/services?limit=200`,
      {
        headers: {
          'Authorization': `Bearer ${CONFIG.authToken}`,
        },
      }
    );
    
    const finalServices = finalResponse.data.data?.services || [];
    const categories = {};
    finalServices.forEach(s => {
      categories[s.category] = (categories[s.category] || 0) + 1;
    });
    
    Object.entries(categories).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count} servicios`);
    });
    
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

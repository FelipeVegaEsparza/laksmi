/**
 * Script para crear categorías correctas y eliminar las antiguas
 * 
 * Uso: node backend/scripts/fix-categories.js
 */

require('dotenv').config({ path: './backend/scripts/.env.import' });
const axios = require('axios');

const CONFIG = {
  apiUrl: process.env.LAXMI_API_URL,
  authToken: process.env.LAXMI_AUTH_TOKEN,
};

// Categorías correctas que deben existir
const CORRECT_CATEGORIES = [
  { name: 'Depilación Láser Hombre', type: 'service' },
  { name: 'Depilación Láser Mujer', type: 'service' },
  { name: 'Sin categoría', type: 'service' },
];

// Categorías a eliminar (IDs específicos)
const CATEGORIES_TO_DELETE = [
  'f164b3b9-c1ae-11f0-84d2-02420a000390', // Depilación Laser Hombre
  'f96e7d3c-c1ae-11f0-84d2-02420a000390', // Depilación Laser Mujer
];

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🔧 REPARANDO CATEGORÍAS');
  console.log('='.repeat(60) + '\n');

  try {
    // 1. Crear categorías correctas si no existen
    console.log('📝 Creando categorías correctas...\n');
    
    for (const category of CORRECT_CATEGORIES) {
      try {
        await axios.post(
          `${CONFIG.apiUrl}/api/v1/categories`,
          {
            name: category.name,
            type: category.type,
            isActive: true,
          },
          {
            headers: {
              'Authorization': `Bearer ${CONFIG.authToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        console.log(`✅ Creada: "${category.name}"`);
      } catch (error) {
        if (error.response?.status === 400 && error.response?.data?.error?.includes('Ya existe')) {
          console.log(`ℹ️  Ya existe: "${category.name}"`);
        } else {
          console.log(`❌ Error creando "${category.name}": ${error.message}`);
        }
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n' + '='.repeat(60));
    console.log('🗑️  Eliminando categorías antiguas...\n');

    // 2. Desactivar categorías antiguas (no se pueden eliminar si tienen servicios)
    for (const categoryId of CATEGORIES_TO_DELETE) {
      try {
        await axios.put(
          `${CONFIG.apiUrl}/api/v1/categories/${categoryId}`,
          {
            isActive: false,
          },
          {
            headers: {
              'Authorization': `Bearer ${CONFIG.authToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        console.log(`✅ Desactivada categoría: ${categoryId}`);
      } catch (error) {
        console.log(`❌ Error desactivando ${categoryId}: ${error.message}`);
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ PROCESO COMPLETADO');
    console.log('='.repeat(60));
    console.log('\nLas categorías antiguas fueron desactivadas.');
    console.log('El frontend solo mostrará las categorías activas.\n');

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

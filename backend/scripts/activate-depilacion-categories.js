/**
 * Script para activar las categorías de depilación
 */

require('dotenv').config({ path: './backend/scripts/.env.import' });
const axios = require('axios');

const CONFIG = {
  apiUrl: process.env.LAXMI_API_URL,
  authToken: process.env.LAXMI_AUTH_TOKEN,
};

// IDs de las categorías a activar y renombrar
const CATEGORIES_TO_FIX = [
  { id: 'f164b3b9-c1ae-11f0-84d2-02420a000390', newName: 'Depilación Láser Hombre' },
  { id: 'f96e7d3c-c1ae-11f0-84d2-02420a000390', newName: 'Depilación Láser Mujer' },
];

async function main() {
  console.log('\n🔧 Activando y renombrando categorías de depilación...\n');

  for (const cat of CATEGORIES_TO_FIX) {
    try {
      await axios.put(
        `${CONFIG.apiUrl}/api/v1/categories/${cat.id}`,
        {
          name: cat.newName,
          isActive: true,
        },
        {
          headers: {
            'Authorization': `Bearer ${CONFIG.authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log(`✅ Actualizada: "${cat.newName}"`);
    } catch (error) {
      console.log(`❌ Error: ${error.response?.data?.error || error.message}`);
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\n✅ Proceso completado\n');
}

main();

/**
 * Script para crear las categorías faltantes
 */

require('dotenv').config({ path: './backend/scripts/.env.import' });
const axios = require('axios');

const CONFIG = {
  apiUrl: process.env.LAXMI_API_URL,
  authToken: process.env.LAXMI_AUTH_TOKEN,
};

async function main() {
  console.log('\n🔧 Creando categorías faltantes...\n');

  const categories = [
    'Depilación Láser Hombre',
    'Depilación Láser Mujer',
    'Manos y Pies',
    'Spa',
    'Consultoría',
  ];

  for (const name of categories) {
    try {
      const response = await axios.post(
        `${CONFIG.apiUrl}/api/v1/categories`,
        {
          name: name,
          type: 'service',
          isActive: true,
        },
        {
          headers: {
            'Authorization': `Bearer ${CONFIG.authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log(`✅ Creada: "${name}"`);
    } catch (error) {
      if (error.response?.data?.error?.includes('Ya existe')) {
        console.log(`ℹ️  Ya existe: "${name}"`);
      } else {
        console.log(`❌ Error: "${name}" - ${error.response?.data?.error || error.message}`);
      }
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\n✅ Proceso completado\n');
}

main();

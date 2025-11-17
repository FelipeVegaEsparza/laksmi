/**
 * Script para activar todos los servicios inactivos
 * 
 * Uso: node backend/scripts/activate-services.js
 */

require('dotenv').config({ path: './backend/scripts/.env.import' });
const axios = require('axios');

const CONFIG = {
  apiUrl: process.env.LAXMI_API_URL,
  authToken: process.env.LAXMI_AUTH_TOKEN,
};

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🔄 ACTIVANDO SERVICIOS INACTIVOS');
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
    console.log(`✅ Total de servicios: ${services.length}`);

    const inactiveServices = services.filter(s => !s.isActive);
    console.log(`⚠️  Servicios inactivos: ${inactiveServices.length}`);

    if (inactiveServices.length === 0) {
      console.log('\n✅ Todos los servicios ya están activos!');
      return;
    }

    // 2. Activar cada servicio inactivo
    console.log(`\n🔄 Activando ${inactiveServices.length} servicios...\n`);
    
    let activated = 0;
    let failed = 0;

    for (const service of inactiveServices) {
      try {
        await axios.put(
          `${CONFIG.apiUrl}/api/v1/services/${service.id}`,
          { isActive: true },
          {
            headers: {
              'Authorization': `Bearer ${CONFIG.authToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        console.log(`✅ Activado: ${service.name}`);
        activated++;
      } catch (error) {
        console.log(`❌ Error activando "${service.name}": ${error.message}`);
        failed++;
      }

      // Pequeña pausa para no saturar el servidor
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 3. Resumen
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN');
    console.log('='.repeat(60));
    console.log(`✅ Activados: ${activated}`);
    if (failed > 0) {
      console.log(`❌ Fallidos: ${failed}`);
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

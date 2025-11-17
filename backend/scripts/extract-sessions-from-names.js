/**
 * Script para extraer el número de sesiones del nombre del servicio
 * y actualizar el campo sessions
 * 
 * Uso: node backend/scripts/extract-sessions-from-names.js
 */

require('dotenv').config({ path: './backend/scripts/.env.import' });
const axios = require('axios');

const CONFIG = {
  apiUrl: process.env.LAXMI_API_URL,
  authToken: process.env.LAXMI_AUTH_TOKEN,
};

function extractSessionsFromName(name) {
  // Buscar patrones como "8 Sesiones", "6 SESIONES", "10 sesiones", etc.
  const patterns = [
    /(\d+)\s+[Ss][Ee][Ss][Ii][Oo][Nn][Ee][Ss]/,  // "8 Sesiones", "6 SESIONES"
    /(\d+)\s+[Ss][Ee][Ss][Ii][Óó][Nn]/,          // "8 Sesión"
  ];

  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match) {
      return parseInt(match[1]);
    }
  }

  return null;
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🔢 EXTRAYENDO SESIONES DE NOMBRES DE SERVICIOS');
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

    // 2. Identificar servicios que tienen sesiones en el nombre
    const servicesToUpdate = [];
    
    for (const service of services) {
      const sessionsInName = extractSessionsFromName(service.name);
      
      if (sessionsInName && sessionsInName !== service.sessions) {
        servicesToUpdate.push({
          id: service.id,
          name: service.name,
          currentSessions: service.sessions,
          newSessions: sessionsInName,
        });
      }
    }

    console.log(`📊 Servicios a actualizar: ${servicesToUpdate.length}\n`);

    if (servicesToUpdate.length === 0) {
      console.log('✅ No hay servicios que necesiten actualización!');
      return;
    }

    // Mostrar algunos ejemplos
    console.log('Ejemplos de cambios:');
    servicesToUpdate.slice(0, 5).forEach(s => {
      console.log(`  "${s.name}"`);
      console.log(`    ${s.currentSessions} → ${s.newSessions} sesiones\n`);
    });

    // 3. Actualizar cada servicio
    console.log('🔄 Actualizando servicios...\n');
    
    let updated = 0;
    let failed = 0;

    for (const service of servicesToUpdate) {
      try {
        await axios.put(
          `${CONFIG.apiUrl}/api/v1/services/${service.id}`,
          { sessions: service.newSessions },
          {
            headers: {
              'Authorization': `Bearer ${CONFIG.authToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        console.log(`✅ ${service.name}: ${service.currentSessions} → ${service.newSessions}`);
        updated++;
      } catch (error) {
        console.log(`❌ Error: ${service.name}`);
        failed++;
      }

      // Pequeña pausa
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 4. Resumen
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN');
    console.log('='.repeat(60));
    console.log(`✅ Actualizados: ${updated}`);
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

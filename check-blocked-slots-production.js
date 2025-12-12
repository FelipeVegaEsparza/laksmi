// Script para verificar bloques en producción
const axios = require('axios');

const API_URL = 'https://api.esteticalaksmi.cl/api/v1';

async function checkBlockedSlots() {
  try {
    console.log('🔍 Verificando bloques en producción...\n');
    
    // Obtener bloques del 11 de diciembre
    const response = await axios.get(`${API_URL}/blocked-time-slots/range`, {
      params: {
        startDate: '2025-12-11',
        endDate: '2025-12-11'
      },
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // Necesitarás un token válido
      }
    });
    
    console.log('📋 Bloques encontrados:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.length > 0) {
      response.data.forEach(block => {
        console.log('\n🚫 Bloque:');
        console.log('  ID:', block.id);
        console.log('  Inicio:', new Date(block.startTime).toISOString());
        console.log('  Fin:', new Date(block.endTime).toISOString());
        console.log('  Inicio (Chile):', new Date(block.startTime).toLocaleString('es-CL', { timeZone: 'America/Santiago' }));
        console.log('  Fin (Chile):', new Date(block.endTime).toLocaleString('es-CL', { timeZone: 'America/Santiago' }));
        console.log('  Motivo:', block.reason);
      });
    } else {
      console.log('❌ No se encontraron bloques para el 11 de diciembre');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

checkBlockedSlots();

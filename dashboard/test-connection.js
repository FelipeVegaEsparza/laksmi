const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function testConnection() {
  console.log('🔍 Probando conexión desde dashboard al backend...\n');

  try {
    // 1. Health Check
    console.log('1. 🏥 Health Check:');
    const healthResponse = await axios.get(`${API_URL}/health`, {
      timeout: 5000
    });
    console.log(`   ✅ Status: ${healthResponse.status} - ${healthResponse.data.status}`);
    console.log(`   🕐 Timestamp: ${healthResponse.data.timestamp}\n`);

    // 2. API Root
    console.log('2. 🌐 API Root:');
    const apiResponse = await axios.get(`${API_URL}/api/v1`, {
      timeout: 5000
    });
    console.log(`   ✅ Status: ${apiResponse.status}`);
    console.log(`   📋 Endpoints disponibles: ${Object.keys(apiResponse.data.endpoints).length}\n`);

    // 3. Test CORS
    console.log('3. 🌍 Test CORS:');
    const corsResponse = await axios.get(`${API_URL}/health`, {
      headers: {
        'Origin': 'http://localhost:5173'
      },
      timeout: 5000
    });
    console.log(`   ✅ CORS OK - Status: ${corsResponse.status}\n`);

    console.log('✅ Todas las conexiones funcionan correctamente');
    console.log('🔧 El problema podría estar en:');
    console.log('   1. El dashboard no está ejecutándose correctamente');
    console.log('   2. Hay un problema con el build del dashboard');
    console.log('   3. Variables de entorno incorrectas en el dashboard');

  } catch (error) {
    console.error('❌ Error de conexión:', error.code || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 Soluciones:');
      console.log('   1. Verificar que el backend esté ejecutándose: npm run dev');
      console.log('   2. Verificar que el puerto 3000 esté libre');
      console.log('   3. Verificar que no haya firewall bloqueando la conexión');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('\n🔧 Soluciones:');
      console.log('   1. El backend está tardando mucho en responder');
      console.log('   2. Verificar logs del backend para errores');
    }
  }
}

testConnection();
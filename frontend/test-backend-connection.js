const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/v1';

async function testBackendConnection() {
  console.log('🔍 Probando conexión del frontend con el backend...\n');

  const tests = [
    {
      name: 'Servicios Públicos - GET /api/v1/services/public',
      url: `${API_BASE_URL}/services/public`,
      method: 'GET'
    },
    {
      name: 'Productos Públicos - GET /api/v1/products/public',
      url: `${API_BASE_URL}/products/public`,
      method: 'GET'
    },
    {
      name: 'Categorías de Servicios - GET /api/v1/services/categories',
      url: `${API_BASE_URL}/services/categories`,
      method: 'GET'
    },
    {
      name: 'Categorías de Productos - GET /api/v1/products/categories',
      url: `${API_BASE_URL}/products/categories`,
      method: 'GET'
    },
    {
      name: 'Chat - POST /api/v1/ai/message',
      url: `${API_BASE_URL}/ai/message`,
      method: 'POST',
      data: {
        message: 'Hola, ¿qué servicios ofrecen?',
        clientId: 'test-client-123',
        channel: 'web'
      }
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      console.log(`📡 Probando: ${test.name}`);
      
      const config = {
        method: test.method,
        url: test.url,
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000
      };

      if (test.data) {
        config.data = test.data;
      }

      const response = await axios(config);
      
      console.log(`✅ ÉXITO - Status: ${response.status}`);
      console.log(`   Datos recibidos: ${JSON.stringify(response.data).substring(0, 100)}...`);
      passedTests++;
      
    } catch (error) {
      console.log(`❌ ERROR - ${test.name}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Error: ${error.response.data?.message || error.response.statusText}`);
      } else if (error.request) {
        console.log(`   Error de conexión: No se pudo conectar al backend`);
        console.log(`   ¿Está el backend ejecutándose en ${API_BASE_URL}?`);
      } else {
        console.log(`   Error: ${error.message}`);
      }
    }
    console.log('');
  }

  console.log(`\n📊 RESUMEN:`);
  console.log(`   Tests pasados: ${passedTests}/${totalTests}`);
  console.log(`   Tests fallidos: ${totalTests - passedTests}/${totalTests}`);

  if (passedTests === totalTests) {
    console.log(`\n🎉 ¡Todos los tests pasaron! El frontend puede conectarse correctamente al backend.`);
  } else {
    console.log(`\n⚠️  Algunos tests fallaron. Revisa la configuración del backend.`);
  }

  // Test específico de configuración del frontend
  console.log(`\n🔧 CONFIGURACIÓN DEL FRONTEND:`);
  console.log(`   API URL configurada: ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}`);
  console.log(`   Dashboard URL: ${process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:5173'}`);
  
  return passedTests === totalTests;
}

// Función para verificar si el backend está ejecutándose
async function checkBackendStatus() {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 3000 });
    console.log('✅ Backend está ejecutándose correctamente');
    return true;
  } catch (error) {
    console.log('❌ Backend no está disponible');
    console.log('   Asegúrate de que el backend esté ejecutándose en http://localhost:3000');
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando pruebas de conexión frontend-backend\n');
  
  // Primero verificar si el backend está disponible
  const backendAvailable = await checkBackendStatus();
  console.log('');
  
  if (!backendAvailable) {
    console.log('💡 Para iniciar el backend, ejecuta:');
    console.log('   cd backend && npm run dev');
    console.log('');
  }
  
  // Ejecutar tests de conexión
  await testBackendConnection();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testBackendConnection, checkBackendStatus };
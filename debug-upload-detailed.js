const axios = require('axios');

async function debugUploadDetailed() {
  console.log('🔍 Diagnóstico detallado del error de upload...\n');

  const API_BASE_URL = 'http://localhost:3000/api/v1';
  const BACKEND_URL = 'http://localhost:3000';

  // Test 1: Verificar que el backend esté ejecutándose
  console.log('📡 Test 1: Verificando backend');
  try {
    const response = await axios.get(`${BACKEND_URL}/health`, { timeout: 3000 });
    console.log('   ✅ Backend está ejecutándose');
    console.log(`   📋 Versión: ${response.data.version}`);
  } catch (error) {
    console.log('   ❌ Backend no está disponible');
    console.log('   💡 Ejecuta: cd backend && npm run dev');
    return;
  }

  // Test 2: Verificar endpoints disponibles
  console.log('\n📋 Test 2: Verificando endpoints disponibles');
  try {
    const response = await axios.get(`${API_BASE_URL}`, { timeout: 3000 });
    console.log('   ✅ API principal responde');
    console.log('   📋 Endpoints disponibles:');
    Object.keys(response.data.endpoints).forEach(endpoint => {
      console.log(`      - ${endpoint}: ${response.data.endpoints[endpoint]}`);
    });
    
    // Verificar específicamente si upload está en la lista
    if (response.data.endpoints.upload) {
      console.log('   ✅ Endpoint upload está registrado');
    } else {
      console.log('   ❌ Endpoint upload NO está registrado');
    }
  } catch (error) {
    console.log('   ❌ Error al obtener endpoints');
    console.log(`   Error: ${error.message}`);
  }

  // Test 3: Intentar login
  console.log('\n🔐 Test 3: Verificando autenticación');
  let token = null;
  try {
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    if (loginResponse.data.success) {
      console.log('   ✅ Login exitoso');
      token = loginResponse.data.data.token;
      console.log(`   🔑 Token obtenido: ${token.substring(0, 20)}...`);
    } else {
      console.log('   ❌ Login falló');
      console.log(`   Error: ${loginResponse.data.error}`);
      return;
    }
  } catch (authError) {
    console.log('   ❌ Error de autenticación');
    if (authError.response) {
      console.log(`   Status: ${authError.response.status}`);
      console.log(`   Error: ${authError.response.data?.message || authError.response.statusText}`);
    } else {
      console.log(`   Error: ${authError.message}`);
    }
    return;
  }

  // Test 4: Probar endpoint de upload GET
  console.log('\n📤 Test 4: Probando GET /upload/products');
  try {
    const uploadResponse = await axios.get(`${API_BASE_URL}/upload/products`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('   ✅ GET /upload/products funciona');
    console.log(`   📋 Respuesta: ${JSON.stringify(uploadResponse.data).substring(0, 100)}...`);
  } catch (uploadError) {
    console.log('   ❌ Error en GET /upload/products');
    if (uploadError.response) {
      console.log(`   Status: ${uploadError.response.status}`);
      console.log(`   Error: ${uploadError.response.data?.message || uploadError.response.statusText}`);
      console.log(`   URL completa: ${uploadError.config?.url}`);
    } else {
      console.log(`   Error: ${uploadError.message}`);
    }
  }

  // Test 5: Probar endpoint de upload POST con FormData
  console.log('\n📤 Test 5: Probando POST /upload/products con FormData');
  try {
    const FormData = require('form-data');
    const fs = require('fs');
    
    // Crear un archivo de prueba pequeño
    const testImageContent = Buffer.from('fake-image-data');
    const formData = new FormData();
    formData.append('images', testImageContent, {
      filename: 'test.jpg',
      contentType: 'image/jpeg'
    });

    const uploadResponse = await axios.post(`${API_BASE_URL}/upload/products`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });
    console.log('   ✅ POST /upload/products funciona');
    console.log(`   📋 Respuesta: ${JSON.stringify(uploadResponse.data).substring(0, 100)}...`);
  } catch (uploadError) {
    console.log('   ❌ Error en POST /upload/products');
    if (uploadError.response) {
      console.log(`   Status: ${uploadError.response.status}`);
      console.log(`   Error: ${uploadError.response.data?.message || uploadError.response.statusText}`);
      console.log(`   URL completa: ${uploadError.config?.url}`);
    } else {
      console.log(`   Error: ${uploadError.message}`);
    }
  }

  // Test 6: Verificar configuración del dashboard
  console.log('\n🎨 Test 6: Configuración del dashboard');
  console.log(`   VITE_API_URL: ${process.env.VITE_API_URL || 'No configurado'}`);
  console.log(`   URL base calculada: ${process.env.VITE_API_URL || 'http://localhost:3000'}/api/v1`);

  // Test 7: Simular la llamada exacta del dashboard
  console.log('\n🔍 Test 7: Simulando llamada del dashboard');
  try {
    const dashboardApiUrl = (process.env.VITE_API_URL || 'http://localhost:3000') + '/api/v1';
    console.log(`   URL que usa el dashboard: ${dashboardApiUrl}/upload/products`);
    
    const testResponse = await axios.get(`${dashboardApiUrl}/upload/products`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('   ✅ Llamada del dashboard simulada exitosa');
  } catch (error) {
    console.log('   ❌ Error en llamada del dashboard simulada');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   URL: ${error.config?.url}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
  }

  console.log('\n💡 ANÁLISIS:');
  console.log('   Si los tests 1-5 pasan pero el dashboard falla:');
  console.log('   - Problema de configuración en el dashboard');
  console.log('   - Token inválido/expirado en localStorage');
  console.log('   - URL incorrecta en VITE_API_URL');
  console.log('');
  console.log('   Si los tests fallan:');
  console.log('   - Backend no compilado correctamente');
  console.log('   - Rutas no registradas');
  console.log('   - Middleware bloqueando requests');
}

if (require.main === module) {
  debugUploadDetailed().catch(console.error);
}

module.exports = { debugUploadDetailed };
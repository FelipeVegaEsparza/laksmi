const axios = require('axios');

console.log('🔍 Debugeando problemas de APIs del dashboard...\n');

async function debugApiIssues() {
  try {
    // 1. Test login and get token
    console.log('1. 🔐 Probando login...');
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    if (!loginResponse.data.success) {
      console.log('   ❌ Login falló');
      return;
    }
    
    const token = loginResponse.data.data.accessToken || loginResponse.data.data.token;
    console.log('   ✅ Login exitoso');
    console.log(`   🎫 Token: ${token.substring(0, 50)}...`);
    
    // 2. Test all the failing endpoints
    const endpoints = [
      { name: 'Products', url: '/products' },
      { name: 'Conversations', url: '/conversations' },
      { name: 'Dashboard Stats', url: '/dashboard/stats' },
      { name: 'Bookings Month', url: '/bookings/month?start=2025-10-01T03:00:00.000Z&end=2025-11-01T02:59:59.999Z' },
      { name: 'Conversation Metrics', url: '/conversations/metrics' },
      { name: 'Twilio Config', url: '/twilio/config' },
      { name: 'WhatsApp Templates', url: '/twilio/templates' }
    ];
    
    console.log('\n2. 🔍 Probando endpoints que fallan...');
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`http://localhost:3000/api/v1${endpoint.url}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 5000
        });
        console.log(`   ✅ ${endpoint.name}: ${response.status} - ${response.data.success ? 'OK' : 'Error'}`);
      } catch (error) {
        console.log(`   ❌ ${endpoint.name}: ${error.response?.status || 'TIMEOUT'} - ${error.response?.data?.error || error.message}`);
      }
    }
    
    // 3. Check which routes actually exist
    console.log('\n3. 📋 Verificando rutas disponibles...');
    try {
      const apiResponse = await axios.get('http://localhost:3000/api/v1');
      console.log('   ✅ Rutas disponibles:');
      Object.keys(apiResponse.data.endpoints).forEach(route => {
        console.log(`      - /${route}`);
      });
    } catch (error) {
      console.log('   ❌ No se pudo obtener lista de rutas');
    }
    
    // 4. Test products specifically (since it has data)
    console.log('\n4. 📦 Test específico de productos...');
    try {
      const productsResponse = await axios.get('http://localhost:3000/api/v1/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (productsResponse.data.success) {
        console.log(`   ✅ Products API funciona: ${productsResponse.data.data.total} productos`);
        console.log(`   📊 Estructura de respuesta: ${Object.keys(productsResponse.data.data).join(', ')}`);
      } else {
        console.log('   ❌ Products API devuelve success: false');
      }
    } catch (error) {
      console.log(`   ❌ Products API error: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🔧 ANÁLISIS DE PROBLEMAS:');
  console.log('');
  console.log('1. 📦 PRODUCTOS:');
  console.log('   - Error: "Cannot read properties of undefined (reading \'filter\')"');
  console.log('   - Causa: response.data.data puede ser undefined');
  console.log('   - Solución: Agregar validación en ProductsPage.tsx');
  console.log('');
  console.log('2. 🗣️  CONVERSACIONES:');
  console.log('   - Error: 401 Unauthorized en /conversations/stream');
  console.log('   - Causa: Endpoint no existe o token no válido para SSE');
  console.log('   - Solución: Verificar rutas de conversaciones');
  console.log('');
  console.log('3. 📊 DASHBOARD:');
  console.log('   - Error: Request failed en dashboard data');
  console.log('   - Causa: Endpoints de métricas no implementados');
  console.log('   - Solución: Implementar endpoints faltantes');
  console.log('');
  console.log('4. 📅 BOOKINGS:');
  console.log('   - Error: 404 en /bookings/month');
  console.log('   - Causa: Endpoint no implementado');
  console.log('   - Solución: Implementar endpoint de bookings por mes');
  console.log('');
  console.log('5. ⚙️  SETTINGS:');
  console.log('   - Error: Request failed en Twilio config');
  console.log('   - Causa: Endpoints de Twilio no implementados');
  console.log('   - Solución: Implementar endpoints de configuración');
}

debugApiIssues();
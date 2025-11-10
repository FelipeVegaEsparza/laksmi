const axios = require('axios');

console.log('🔍 Probando endpoints del dashboard...\n');

async function testDashboardEndpoints() {
  try {
    // 1. Login
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login exitoso\n');
    
    // 2. Test dashboard endpoints
    const dashboardEndpoints = [
      '/dashboard/metrics',
      '/dashboard/recent-bookings',
      '/dashboard/active-conversations',
      '/dashboard/stats'
    ];
    
    console.log('📊 Probando endpoints del dashboard...');
    
    for (const endpoint of dashboardEndpoints) {
      try {
        const response = await axios.get(`http://localhost:3000/api/v1${endpoint}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 5000
        });
        
        console.log(`   ✅ ${endpoint}: ${response.status} - OK`);
        
      } catch (error) {
        const status = error.response?.status;
        const errorMsg = error.response?.data?.error || error.message;
        console.log(`   ❌ ${endpoint}: ${status || 'ERROR'} - ${errorMsg}`);
      }
    }
    
    // 3. Check what dashboard endpoints actually exist
    console.log('\n🔍 Verificando rutas disponibles...');
    try {
      const apiResponse = await axios.get('http://localhost:3000/api/v1');
      const endpoints = apiResponse.data.endpoints;
      
      console.log('📋 Endpoints disponibles:');
      Object.keys(endpoints).forEach(route => {
        console.log(`   - /${route}`);
      });
      
      if (!endpoints.dashboard) {
        console.log('\n⚠️  No hay endpoint /dashboard en la lista');
        console.log('💡 Posibles soluciones:');
        console.log('   1. Crear endpoints de dashboard faltantes');
        console.log('   2. Usar endpoints existentes para obtener métricas');
        console.log('   3. Crear datos mock para el dashboard');
      }
      
    } catch (error) {
      console.log('❌ No se pudo obtener lista de endpoints');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

testDashboardEndpoints();
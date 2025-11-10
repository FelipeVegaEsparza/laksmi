const axios = require('axios');

console.log('🔍 Verificando rate limiting...\n');

async function checkRateLimit() {
  try {
    // 1. Check health first
    console.log('1. 🏥 Health check...');
    const healthResponse = await axios.get('http://localhost:3000/health');
    console.log(`   ✅ Backend disponible: ${healthResponse.data.status}`);
    
    // 2. Try login with delay
    console.log('\n2. 🔐 Probando login después de delay...');
    
    // Wait 30 seconds to avoid rate limiting
    console.log('   ⏳ Esperando 30 segundos para evitar rate limiting...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    if (loginResponse.data.success) {
      console.log('   ✅ Login exitoso después del delay');
      
      const token = loginResponse.data.data.accessToken;
      
      // 3. Quick test of main APIs
      console.log('\n3. 📊 Test rápido de APIs principales...');
      
      const quickTests = [
        { name: 'Products', url: '/products' },
        { name: 'Clients', url: '/clients' },
        { name: 'Services', url: '/services/public' }
      ];
      
      for (const test of quickTests) {
        try {
          const response = await axios.get(`http://localhost:3000/api/v1${test.url}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          const data = response.data.data;
          let count = 0;
          
          if (data.products) count = data.products.length;
          else if (data.clients) count = data.clients.length;
          else if (data.services) count = data.services.length;
          else if (Array.isArray(data)) count = data.length;
          
          console.log(`   ✅ ${test.name}: ${count} elementos`);
          
        } catch (error) {
          console.log(`   ❌ ${test.name}: ${error.response?.status || 'ERROR'}`);
        }
      }
      
    } else {
      console.log('   ❌ Login aún falló:', loginResponse.data.error);
    }
    
  } catch (error) {
    if (error.response?.status === 429) {
      console.log('❌ Rate limiting aún activo');
      console.log('💡 Soluciones:');
      console.log('   1. Esperar 5-10 minutos');
      console.log('   2. Reiniciar el backend para resetear rate limiting');
      console.log('   3. Verificar configuración de rate limiting en backend');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

// Don't run immediately to avoid rate limiting
console.log('⚠️  Rate limiting detectado. Esperando antes de probar...');
checkRateLimit();
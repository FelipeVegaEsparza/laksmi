const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function testLogin() {
  console.log('🔍 Probando login y APIs autenticadas...\n');

  try {
    // 1. Health Check
    console.log('1. 🏥 Health Check:');
    const healthResponse = await axios.get(`${API_URL}/health`);
    console.log(`   ✅ Status: ${healthResponse.status} - ${healthResponse.data.status}\n`);

    // 2. Login
    console.log('2. 🔐 Login:');
    const loginResponse = await axios.post(`${API_URL}/api/v1/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    if (loginResponse.data.success) {
      console.log(`   ✅ Login exitoso`);
      console.log(`   👤 Usuario: ${loginResponse.data.data.user.username}`);
      console.log(`   🎫 Token obtenido\n`);
      
      const token = loginResponse.data.data.token;
      
      // 3. Test Products API with token
      console.log('3. 📦 Products API (con token):');
      const productsResponse = await axios.get(`${API_URL}/api/v1/products`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (productsResponse.data.success) {
        console.log(`   ✅ Status: ${productsResponse.status}`);
        console.log(`   📊 Total productos: ${productsResponse.data.data.total}`);
        console.log(`   📋 Productos encontrados: ${productsResponse.data.data.data.length}`);
        
        if (productsResponse.data.data.data.length > 0) {
          console.log(`   🔍 Primer producto: ${productsResponse.data.data.data[0].name}`);
        }
      }
      
    } else {
      console.log(`   ❌ Login falló: ${loginResponse.data.error}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 Posibles soluciones:');
      console.log('   1. Verificar que el backend esté ejecutándose en puerto 3000');
      console.log('   2. Ejecutar: npm run dev en la carpeta backend');
      console.log('   3. Verificar que no haya errores en la consola del backend');
    }
  }
}

testLogin();
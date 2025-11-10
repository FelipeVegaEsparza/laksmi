const axios = require('axios');

console.log('🔍 Debugeando problema de autenticación...\n');

async function debugAuthIssue() {
  try {
    // 1. Test login
    console.log('1. 🔐 Probando login...');
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    if (!loginResponse.data.success) {
      console.log('   ❌ Login falló:', loginResponse.data.error);
      return;
    }
    
    console.log('   ✅ Login exitoso');
    console.log('   📋 Respuesta:', JSON.stringify(loginResponse.data, null, 2));
    
    // Extract token - check both possible locations
    const token = loginResponse.data.data.accessToken || loginResponse.data.data.token;
    
    if (!token) {
      console.log('   ❌ No se encontró token en la respuesta');
      console.log('   🔍 Estructura de datos:', Object.keys(loginResponse.data.data));
      return;
    }
    
    console.log(`   🎫 Token extraído: ${token.substring(0, 50)}...`);
    
    // 2. Test verify endpoint
    console.log('\n2. 🔍 Probando verify...');
    try {
      const verifyResponse = await axios.get('http://localhost:3000/api/v1/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('   ✅ Verify exitoso');
      console.log('   👤 Usuario verificado:', verifyResponse.data.data.user.username);
      
    } catch (verifyError) {
      console.log('   ❌ Error en verify:', verifyError.response?.status, verifyError.response?.data);
      
      if (verifyError.response?.status === 403) {
        console.log('   🔧 Error 403 - Token inválido o expirado');
        console.log('   💡 Posibles causas:');
        console.log('      - Token malformado');
        console.log('      - Secreto JWT incorrecto');
        console.log('      - Token expirado');
        console.log('      - Usuario inactivo');
      }
    }
    
    // 3. Test products endpoint
    console.log('\n3. 📦 Probando products...');
    try {
      const productsResponse = await axios.get('http://localhost:3000/api/v1/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('   ✅ Products exitoso');
      console.log(`   📊 Total productos: ${productsResponse.data.data.total}`);
      
    } catch (productsError) {
      console.log('   ❌ Error en products:', productsError.response?.status, productsError.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('🔧 Backend no disponible - ejecutar: npm run dev');
    }
  }
}

debugAuthIssue();
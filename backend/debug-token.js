const axios = require('axios');
const jwt = require('jsonwebtoken');

const API_URL = 'http://localhost:3000';
const JWT_SECRET = 'mi-clave-jwt-super-secreta-para-desarrollo-local-cambiar-en-produccion';

async function debugToken() {
  console.log('🔍 Debug del sistema de tokens...\n');

  try {
    // 1. Login
    console.log('1. 🔐 Realizando login...');
    const loginResponse = await axios.post(`${API_URL}/api/v1/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.accessToken || loginResponse.data.data.token;
      console.log(`   ✅ Login exitoso`);
      console.log(`   🎫 Token recibido: ${token.substring(0, 50)}...`);
      
      // 2. Decodificar token manualmente
      console.log('\n2. 🔍 Decodificando token...');
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log(`   ✅ Token válido`);
        console.log(`   👤 Usuario ID: ${decoded.userId}`);
        console.log(`   📧 Email: ${decoded.email}`);
        console.log(`   🎭 Rol: ${decoded.role}`);
        console.log(`   ⏰ Expira: ${new Date(decoded.exp * 1000).toLocaleString()}`);
      } catch (decodeError) {
        console.log(`   ❌ Error decodificando: ${decodeError.message}`);
        return;
      }
      
      // 3. Test verify endpoint
      console.log('\n3. 🔍 Probando endpoint verify...');
      try {
        const verifyResponse = await axios.get(`${API_URL}/api/v1/auth/verify`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log(`   ✅ Verify exitoso: ${JSON.stringify(verifyResponse.data, null, 2)}`);
      } catch (verifyError) {
        console.log(`   ❌ Error en verify: ${verifyError.response?.data || verifyError.message}`);
      }
      
      // 4. Test products endpoint
      console.log('\n4. 📦 Probando endpoint products...');
      try {
        const productsResponse = await axios.get(`${API_URL}/api/v1/products`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log(`   ✅ Products exitoso: ${productsResponse.data.data.total} productos encontrados`);
      } catch (productsError) {
        console.log(`   ❌ Error en products: ${productsError.response?.data || productsError.message}`);
      }
      
    } else {
      console.log(`   ❌ Login falló: ${loginResponse.data.error}`);
    }

  } catch (error) {
    console.error('❌ Error general:', error.response?.data || error.message);
  }
}

debugToken();
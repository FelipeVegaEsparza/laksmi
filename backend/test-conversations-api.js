const axios = require('axios');

console.log('🔍 Probando API de conversaciones...\n');

async function testConversationsApi() {
  try {
    // 1. Login
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login exitoso\n');
    
    // 2. Test conversations API
    console.log('📞 Probando API de conversaciones...');
    const conversationsResponse = await axios.get('http://localhost:3000/api/v1/conversations', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`Status: ${conversationsResponse.status}`);
    console.log(`Success: ${conversationsResponse.data.success}`);
    console.log(`Data type: ${Array.isArray(conversationsResponse.data.data) ? 'Array' : 'Object'}`);
    
    if (Array.isArray(conversationsResponse.data.data)) {
      console.log(`Array length: ${conversationsResponse.data.data.length}`);
    } else if (conversationsResponse.data.data && typeof conversationsResponse.data.data === 'object') {
      console.log(`Object keys: ${Object.keys(conversationsResponse.data.data).join(', ')}`);
    }
    
    // 3. Test with pagination params
    console.log('\n📄 Probando con parámetros de paginación...');
    const paginatedResponse = await axios.get('http://localhost:3000/api/v1/conversations?page=1&limit=5', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`Paginated data type: ${Array.isArray(paginatedResponse.data.data) ? 'Array' : 'Object'}`);
    if (paginatedResponse.data.data && typeof paginatedResponse.data.data === 'object' && !Array.isArray(paginatedResponse.data.data)) {
      console.log(`Paginated keys: ${Object.keys(paginatedResponse.data.data).join(', ')}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testConversationsApi();
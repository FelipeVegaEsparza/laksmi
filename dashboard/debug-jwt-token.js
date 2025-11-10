// Debug JWT token issue
const axios = require('axios');

async function debugJWTToken() {
  try {
    console.log('🔍 Debugging JWT token issue...\n');
    
    // 1. Login and get token
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    console.log('✅ Login successful');
    console.log('📋 Full login response:', JSON.stringify(loginResponse.data, null, 2));
    
    const token = loginResponse.data.data.accessToken || loginResponse.data.data.token;
    const user = loginResponse.data.data.user;
    
    if (!token) {
      console.log('❌ No token received!');
      return;
    }
    
    console.log('🎫 Token received:', token.substring(0, 50) + '...');
    
    // 2. Check token format
    console.log('\n🔍 Token format check:');
    console.log('Token length:', token.length);
    console.log('Token parts:', token.split('.').length);
    console.log('Starts with Bearer format:', token.includes('.'));
    
    // 3. Test token with different endpoints
    console.log('\n🧪 Testing token with different endpoints...');
    
    // Test auth/me endpoint
    try {
      const meResponse = await axios.get('http://localhost:3000/api/v1/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('✅ /auth/me works:', meResponse.status);
      
    } catch (meError) {
      console.log('❌ /auth/me error:', meError.response?.status, meError.response?.data);
    }
    
    // Test clients endpoint (should require auth)
    try {
      const clientsResponse = await axios.get('http://localhost:3000/api/v1/clients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('✅ /clients works:', clientsResponse.status);
      
    } catch (clientsError) {
      console.log('❌ /clients error:', clientsError.response?.status, clientsError.response?.data);
    }
    
    // 4. Check if it's a timing issue
    console.log('\n⏰ Waiting 2 seconds and testing again...');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const delayedResponse = await axios.get('http://localhost:3000/api/v1/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('✅ Delayed /auth/me works:', delayedResponse.status);
      
    } catch (delayedError) {
      console.log('❌ Delayed /auth/me error:', delayedError.response?.status, delayedError.response?.data);
    }
    
  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

debugJWTToken();
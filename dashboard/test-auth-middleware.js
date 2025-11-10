// Test auth middleware issue
const axios = require('axios');

async function testAuthMiddleware() {
  try {
    console.log('🔍 Testing auth middleware...\n');
    
    // 1. Login and get user info
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.token;
    const user = loginResponse.data.data.user;
    
    console.log('✅ Login successful');
    console.log('👤 User:', JSON.stringify(user, null, 2));
    
    // 2. Test a working authenticated endpoint
    console.log('\n🧪 Testing working authenticated endpoint...');
    
    try {
      const productsResponse = await axios.get('http://localhost:3000/api/v1/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('✅ Products endpoint works:', productsResponse.status);
      
    } catch (error) {
      console.log('❌ Products endpoint error:', error.response?.status, error.response?.data);
    }
    
    // 3. Test upload endpoint with detailed error info
    console.log('\n🧪 Testing upload endpoint with auth details...');
    
    try {
      const uploadResponse = await axios.get('http://localhost:3000/api/v1/upload/services', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Upload endpoint response:', uploadResponse.data);
      
    } catch (uploadError) {
      console.log('❌ Upload endpoint detailed error:');
      console.log('Status:', uploadError.response?.status);
      console.log('Headers:', uploadError.response?.headers);
      console.log('Data:', uploadError.response?.data);
    }
    
    // 4. Test if the route exists at all
    console.log('\n🧪 Testing route existence...');
    
    try {
      const optionsResponse = await axios.options('http://localhost:3000/api/v1/upload/services');
      console.log('OPTIONS response:', optionsResponse.status, optionsResponse.headers);
      
    } catch (optionsError) {
      console.log('OPTIONS error:', optionsError.response?.status);
    }
    
  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

testAuthMiddleware();
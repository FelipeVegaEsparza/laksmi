// Debug upload endpoint
const axios = require('axios');

async function debugUpload() {
  try {
    // Login first
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');
    
    // Test different endpoints to see routing
    console.log('\n🔍 Testing different endpoints:');
    
    // Test 1: Check if upload endpoint responds to GET
    try {
      const getResponse = await axios.get('http://localhost:3000/api/v1/upload/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('GET /upload/products:', getResponse.status, getResponse.data);
    } catch (error) {
      console.log('GET /upload/products error:', error.response?.status, error.response?.data?.message);
    }
    
    // Test 2: Check if upload base endpoint exists
    try {
      const baseResponse = await axios.get('http://localhost:3000/api/v1/upload', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('GET /upload:', baseResponse.status, baseResponse.data);
    } catch (error) {
      console.log('GET /upload error:', error.response?.status, error.response?.data?.message);
    }
    
    // Test 3: Try POST without data
    try {
      const postResponse = await axios.post('http://localhost:3000/api/v1/upload/products', {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('POST /upload/products (empty):', postResponse.status, postResponse.data);
    } catch (error) {
      console.log('POST /upload/products (empty) error:', error.response?.status, error.response?.data?.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugUpload();
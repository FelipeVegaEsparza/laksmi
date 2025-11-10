// Verify upload fix with temporary endpoint
const axios = require('axios');
const FormData = require('form-data');

async function verifyUploadFix() {
  try {
    console.log('🔍 Testing temporary upload endpoint...\n');
    
    // Wait a bit to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Login
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login successful');
    
    // Test temporary upload endpoint
    console.log('\n📤 Testing temporary upload endpoint...');
    
    const formData = new FormData();
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    
    formData.append('images', testImageBuffer, {
      filename: 'test.png',
      contentType: 'image/png'
    });
    
    const uploadResponse = await axios.post(
      'http://localhost:3000/api/v1/upload-temp/services',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('✅ Temporary upload successful!');
    console.log('📋 Response:', JSON.stringify(uploadResponse.data, null, 2));
    
    // Test GET endpoint
    console.log('\n📋 Testing GET /upload-temp/services...');
    
    const getResponse = await axios.get('http://localhost:3000/api/v1/upload-temp/services', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ GET successful!');
    console.log('📋 Files:', JSON.stringify(getResponse.data, null, 2));
    
    // Now test original endpoint for comparison
    console.log('\n📤 Testing original upload endpoint for comparison...');
    
    try {
      const originalResponse = await axios.get('http://localhost:3000/api/v1/upload/services', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const isApiResponse = originalResponse.data.message === 'API del Sistema de Gestión de Clínica de Belleza';
      console.log(`${isApiResponse ? '❌' : '✅'} Original endpoint: ${isApiResponse ? 'still broken (catch-all)' : 'working'}`);
      
    } catch (originalError) {
      console.log('❌ Original endpoint error:', originalError.response?.status, originalError.response?.data?.message);
    }
    
  } catch (error) {
    console.error('❌ Error:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
    console.error('Full response:', error.response?.data);
  }
}

verifyUploadFix();
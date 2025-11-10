// Test upload with correct token
const axios = require('axios');
const FormData = require('form-data');

async function testUploadFix() {
  try {
    console.log('🔍 Testing upload with correct token...\n');
    
    // 1. Login with correct token handling
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.accessToken; // Use accessToken
    console.log('✅ Login successful, using accessToken');
    
    // 2. Test upload endpoint
    console.log('\n📤 Testing upload endpoint...');
    
    const formData = new FormData();
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    
    formData.append('images', testImageBuffer, {
      filename: 'test.png',
      contentType: 'image/png'
    });
    
    const uploadResponse = await axios.post(
      'http://localhost:3000/api/v1/upload/services',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('✅ Upload successful!');
    console.log('📋 Response:', JSON.stringify(uploadResponse.data, null, 2));
    
    // 3. Test GET endpoint
    console.log('\n📋 Testing GET /upload/services...');
    
    const getResponse = await axios.get('http://localhost:3000/api/v1/upload/services', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ GET successful!');
    console.log('📋 Files:', JSON.stringify(getResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
    console.error('Full response:', error.response?.data);
  }
}

testUploadFix();
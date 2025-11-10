// Simple test for upload endpoint
const axios = require('axios');
const FormData = require('form-data');

async function testUpload() {
  try {
    // Login first
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');
    
    // Test upload endpoint directly
    console.log('Testing upload endpoint...');
    
    const formData = new FormData();
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    
    formData.append('images', testImageBuffer, {
      filename: 'test.png',
      contentType: 'image/png'
    });
    
    const uploadResponse = await axios.post(
      'http://localhost:3000/api/v1/upload/products',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('✅ Upload successful:', uploadResponse.data);
    
  } catch (error) {
    console.error('❌ Error:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
    console.error('Full response:', error.response?.data);
  }
}

testUpload();
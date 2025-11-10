// Detailed debug for upload issue
const axios = require('axios');
const FormData = require('form-data');

async function debugUploadDetailed() {
  try {
    console.log('🔍 Debugging upload issue in detail...\n');
    
    // 1. Login
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');
    
    // 2. Test upload with proper FormData
    console.log('\n📤 Testing upload with FormData...');
    
    const formData = new FormData();
    
    // Create a proper test image buffer (1x1 PNG)
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    
    formData.append('images', testImageBuffer, {
      filename: 'test.png',
      contentType: 'image/png'
    });
    
    console.log('FormData headers:', formData.getHeaders());
    
    try {
      const uploadResponse = await axios.post(
        'http://localhost:3000/api/v1/upload/services',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${token}`
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );
      
      console.log('✅ Upload Response Status:', uploadResponse.status);
      console.log('✅ Upload Response Data:', JSON.stringify(uploadResponse.data, null, 2));
      
    } catch (uploadError) {
      console.log('❌ Upload Error Status:', uploadError.response?.status);
      console.log('❌ Upload Error Data:', uploadError.response?.data);
      console.log('❌ Upload Error Message:', uploadError.message);
      
      // Check response headers
      if (uploadError.response?.headers) {
        console.log('Response Headers:', uploadError.response.headers);
      }
    }
    
    // 3. Test with different content type
    console.log('\n📤 Testing upload without explicit content-type...');
    
    const formData2 = new FormData();
    formData2.append('images', testImageBuffer, 'test2.png');
    
    try {
      const uploadResponse2 = await axios.post(
        'http://localhost:3000/api/v1/upload/services',
        formData2,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            // Let axios set the content-type automatically
          }
        }
      );
      
      console.log('✅ Upload 2 Response:', uploadResponse2.data);
      
    } catch (uploadError2) {
      console.log('❌ Upload 2 Error:', uploadError2.response?.status, uploadError2.response?.data);
    }
    
    // 4. Test GET endpoint
    console.log('\n📋 Testing GET /upload/services...');
    
    try {
      const getResponse = await axios.get('http://localhost:3000/api/v1/upload/services', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('✅ GET Response:', getResponse.data);
      
    } catch (getError) {
      console.log('❌ GET Error:', getError.response?.status, getError.response?.data);
    }
    
  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

debugUploadDetailed();
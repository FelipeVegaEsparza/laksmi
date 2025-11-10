// Test temp upload endpoint with authentication
async function testTempUpload() {
  try {
    console.log('🔍 Testing temp upload endpoint with auth...\n');
    
    // Step 1: Login to get token
    console.log('1. Logging in...');
    const loginResponse = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      throw new Error('Login failed: ' + loginData.message);
    }
    
    const token = loginData.data.accessToken;
    console.log('✅ Login successful, token received');
    
    // Step 2: Test temp upload endpoint
    console.log('\n2. Testing temp upload...');
    
    const imageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const imageBuffer = Buffer.from(imageData, 'base64');
    
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    formData.append('images', blob, 'test.png');
    
    const uploadResponse = await fetch('http://localhost:3000/api/v1/upload-temp/services', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    console.log('Upload Status:', uploadResponse.status);
    const uploadData = await uploadResponse.text();
    console.log('Upload Response:', uploadData.substring(0, 500) + '...');
    
    if (uploadResponse.status === 200) {
      try {
        const parsedData = JSON.parse(uploadData);
        if (parsedData.success) {
          console.log('✅ Temp upload successful!');
          console.log('Files uploaded:', parsedData.data?.files?.length || 0);
        } else {
          console.log('❌ Upload failed:', parsedData.message);
        }
      } catch (e) {
        console.log('❌ Could not parse response as JSON');
      }
    } else {
      console.log('❌ Upload failed with status:', uploadResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Use node-fetch if available
if (typeof fetch === 'undefined') {
  try {
    const { default: fetch, FormData, Blob } = require('node-fetch');
    global.fetch = fetch;
    global.FormData = FormData;
    global.Blob = Blob;
  } catch (e) {
    console.log('node-fetch not available');
  }
}

testTempUpload();
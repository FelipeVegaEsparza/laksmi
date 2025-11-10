// Test directo usando fetch (como el navegador)
async function testDirectUpload() {
  try {
    console.log('🔍 Testing direct upload like browser...\n');
    
    // Test 1: Check if endpoint exists
    console.log('1. Testing endpoint availability...');
    const checkResponse = await fetch('http://localhost:3000/api/v1/upload-simple/services');
    console.log('GET Status:', checkResponse.status);
    
    if (checkResponse.status === 200) {
      const checkData = await checkResponse.text();
      console.log('GET Response:', checkData.substring(0, 200) + '...');
    }
    
    // Test 2: Try upload
    console.log('\n2. Testing upload...');
    
    // Create a simple image file
    const imageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const imageBuffer = Buffer.from(imageData, 'base64');
    
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    formData.append('images', blob, 'test.png');
    
    const uploadResponse = await fetch('http://localhost:3000/api/v1/upload-simple/services', {
      method: 'POST',
      body: formData
    });
    
    console.log('POST Status:', uploadResponse.status);
    const uploadData = await uploadResponse.text();
    console.log('POST Response:', uploadData);
    
    if (uploadResponse.status === 200) {
      console.log('✅ Upload successful!');
    } else {
      console.log('❌ Upload failed');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Use node-fetch if available, otherwise use built-in fetch
if (typeof fetch === 'undefined') {
  console.log('Installing node-fetch...');
  const { default: fetch, FormData, Blob } = require('node-fetch');
  global.fetch = fetch;
  global.FormData = FormData;
  global.Blob = Blob;
}

testDirectUpload();
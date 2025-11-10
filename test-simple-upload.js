// Test simple del endpoint de upload
const http = require('http');
const FormData = require('form-data');

async function testSimpleUpload() {
  try {
    console.log('🔍 Testing simple upload endpoint...\n');
    
    // Create a simple test image buffer
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    
    const formData = new FormData();
    formData.append('images', testImageBuffer, {
      filename: 'test.png',
      contentType: 'image/png'
    });
    
    // Make request using Node.js http module
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/upload-simple/services',
      method: 'POST',
      headers: formData.getHeaders()
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', data);
        
        if (res.statusCode === 200) {
          console.log('✅ Upload endpoint is working!');
        } else {
          console.log('❌ Upload endpoint returned error');
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);
    });
    
    formData.pipe(req);
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testSimpleUpload();
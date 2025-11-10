// Test basic connectivity to backend
const axios = require('axios');

async function testConnectivity() {
  console.log('🔍 Testing connectivity to backend...\n');
  
  const baseUrls = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://0.0.0.0:3000'
  ];
  
  for (const baseUrl of baseUrls) {
    try {
      console.log(`Testing ${baseUrl}...`);
      
      const response = await axios.get(`${baseUrl}/health`, {
        timeout: 5000
      });
      
      console.log(`✅ ${baseUrl} - Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(response.data)}`);
      
    } catch (error) {
      console.log(`❌ ${baseUrl} - Error: ${error.code || error.message}`);
      
      if (error.code === 'ECONNREFUSED') {
        console.log('   Server not running or port blocked');
      } else if (error.code === 'ENOTFOUND') {
        console.log('   DNS resolution failed');
      } else if (error.code === 'ETIMEDOUT') {
        console.log('   Connection timeout');
      }
    }
  }
  
  // Test if backend is running on different port
  console.log('\n🔍 Checking common ports...');
  
  const ports = [3000, 3001, 8000, 8080, 5000];
  
  for (const port of ports) {
    try {
      const response = await axios.get(`http://localhost:${port}/health`, {
        timeout: 2000
      });
      
      console.log(`✅ Found server on port ${port}:`, response.data);
      
    } catch (error) {
      // Silent fail for port scanning
    }
  }
  
  // Check network configuration
  console.log('\n🔍 Network diagnostics:');
  console.log('Current working directory:', process.cwd());
  console.log('Node.js version:', process.version);
  console.log('Platform:', process.platform);
}

testConnectivity();
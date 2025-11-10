// Check available endpoints
async function checkEndpoints() {
  try {
    console.log('🔍 Checking available endpoints...\n');
    
    const response = await fetch('http://localhost:3000/api/v1/');
    const data = await response.json();
    
    console.log('Available endpoints:');
    console.log(JSON.stringify(data.endpoints, null, 2));
    
    if (data.endpoints['upload-simple']) {
      console.log('\n✅ upload-simple endpoint is registered!');
    } else {
      console.log('\n❌ upload-simple endpoint is NOT registered');
      console.log('🔄 Backend needs to be restarted to load new routes');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Use node-fetch if available
if (typeof fetch === 'undefined') {
  try {
    const { default: fetch } = require('node-fetch');
    global.fetch = fetch;
  } catch (e) {
    console.log('node-fetch not available, using built-in fetch');
  }
}

checkEndpoints();
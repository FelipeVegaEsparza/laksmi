// Test a very simple endpoint to see if the server is working
async function testSimpleEndpoint() {
  console.log('🔍 PROBANDO ENDPOINTS BÁSICOS\n');
  
  try {
    // Test health endpoint
    console.log('1. 🏥 Probando /health...');
    const healthResponse = await fetch('http://localhost:3000/health');
    console.log(`   Status: ${healthResponse.status}`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log(`   Response: ${JSON.stringify(healthData)}`);
    }
    
    // Test API base
    console.log('\n2. 📋 Probando /api/v1/...');
    const apiResponse = await fetch('http://localhost:3000/api/v1/');
    console.log(`   Status: ${apiResponse.status}`);
    
    if (apiResponse.ok) {
      const apiData = await apiResponse.json();
      console.log('   Endpoints disponibles:');
      Object.keys(apiData.endpoints).forEach(key => {
        console.log(`   - ${key}: ${apiData.endpoints[key]}`);
      });
    }
    
    // Test our independent endpoint
    console.log('\n3. 🎯 Probando /upload-now/services...');
    const uploadResponse = await fetch('http://localhost:3000/upload-now/services');
    console.log(`   Status: ${uploadResponse.status}`);
    
    const uploadText = await uploadResponse.text();
    console.log(`   Response: ${uploadText}`);
    
    if (uploadResponse.status === 404) {
      console.log('\n❌ PROBLEMA: El endpoint /upload-now no está registrado');
      console.log('🔍 Posibles causas:');
      console.log('   1. Error en el archivo compilado');
      console.log('   2. Error de sintaxis que impide el registro');
      console.log('   3. El servidor no está usando dist/index.js');
    } else if (uploadResponse.status === 200) {
      console.log('\n✅ El endpoint responde correctamente');
    }
    
    // Test a different path to see if routing works
    console.log('\n4. 🔍 Probando ruta inexistente...');
    const notFoundResponse = await fetch('http://localhost:3000/ruta-que-no-existe');
    console.log(`   Status: ${notFoundResponse.status}`);
    const notFoundText = await notFoundResponse.text();
    console.log(`   Response: ${notFoundText}`);
    
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
    console.log('Usando fetch nativo');
  }
}

testSimpleEndpoint();
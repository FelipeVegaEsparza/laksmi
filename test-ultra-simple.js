// Test ultra simple endpoints
async function testUltraSimple() {
  console.log('🎯 PROBANDO ENDPOINTS ULTRA SIMPLES\n');
  
  try {
    // Test simple GET endpoint
    console.log('1. 📋 Probando /test-upload...');
    const testResponse = await fetch('http://localhost:3000/test-upload');
    console.log(`   Status: ${testResponse.status}`);
    
    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log(`   ✅ Response: ${JSON.stringify(testData)}`);
    } else {
      const testText = await testResponse.text();
      console.log(`   ❌ Response: ${testText}`);
    }
    
    // Test simple POST endpoint
    console.log('\n2. 📤 Probando /simple-upload/services...');
    const uploadResponse = await fetch('http://localhost:3000/simple-upload/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'data' })
    });
    
    console.log(`   Status: ${uploadResponse.status}`);
    
    if (uploadResponse.ok) {
      const uploadData = await uploadResponse.json();
      console.log(`   ✅ Response: ${JSON.stringify(uploadData)}`);
      
      if (uploadData.success) {
        console.log('\n🎉 ¡ENDPOINTS SIMPLES FUNCIONAN!');
        console.log('📋 Ahora podemos agregar funcionalidad de upload');
        return true;
      }
    } else {
      const uploadText = await uploadResponse.text();
      console.log(`   ❌ Response: ${uploadText}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📋 Instrucciones:');
    console.log('1. Detén el servidor (Ctrl+C)');
    console.log('2. Ejecuta: npm run build');
    console.log('3. Ejecuta: npm run start');
    console.log('4. Prueba de nuevo');
  }
  
  return false;
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

testUltraSimple();
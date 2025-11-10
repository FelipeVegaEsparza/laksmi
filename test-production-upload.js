// Test upload in production mode
async function testProductionUpload() {
  console.log('🎯 PROBANDO UPLOAD EN MODO PRODUCCIÓN\n');
  
  try {
    // Step 1: Check server
    console.log('1. 🔍 Verificando servidor...');
    const healthResponse = await fetch('http://localhost:3000/health');
    
    if (!healthResponse.ok) {
      console.log('   ❌ Servidor no responde');
      console.log('   📋 Instrucciones:');
      console.log('   1. Detén el servidor de desarrollo (Ctrl+C)');
      console.log('   2. Ejecuta: start-production-backend.bat');
      console.log('   3. Espera a que aparezca "Server running on port 3000"');
      console.log('   4. Ejecuta este test de nuevo');
      return;
    }
    
    console.log('   ✅ Servidor responde');
    
    // Step 2: Check endpoints
    console.log('\n2. 📋 Verificando endpoints...');
    const endpointsResponse = await fetch('http://localhost:3000/api/v1/');
    const endpointsData = await endpointsResponse.json();
    
    console.log('   Endpoints disponibles:');
    Object.keys(endpointsData.endpoints).forEach(key => {
      console.log(`   - ${key}: ${endpointsData.endpoints[key]}`);
    });
    
    if (endpointsData.endpoints['upload-direct-bypass']) {
      console.log('\n   ✅ upload-direct-bypass está registrado!');
    } else {
      console.log('\n   ❌ upload-direct-bypass NO está registrado');
      console.log('   🔄 El servidor debe estar en modo desarrollo, no producción');
      return;
    }
    
    // Step 3: Test upload
    console.log('\n3. 📤 Probando upload...');
    
    const imageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const imageBuffer = Buffer.from(imageData, 'base64');
    
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    formData.append('images', blob, 'test-production.png');
    
    const uploadResponse = await fetch('http://localhost:3000/api/v1/upload-direct-bypass/services', {
      method: 'POST',
      body: formData
    });
    
    console.log(`   Status: ${uploadResponse.status}`);
    const uploadText = await uploadResponse.text();
    
    if (uploadResponse.status === 200) {
      try {
        const uploadData = JSON.parse(uploadText);
        if (uploadData.success) {
          console.log('\n   🎉 ¡UPLOAD EXITOSO EN PRODUCCIÓN!');
          console.log(`   📁 Archivos subidos: ${uploadData.data.files.length}`);
          console.log(`   🔗 URLs: ${uploadData.data.urls.join(', ')}`);
          
          console.log('\n🎉 ¡SOLUCIÓN CONFIRMADA!');
          console.log('📋 El dashboard ahora debería funcionar correctamente');
          console.log('🔧 Para desarrollo, usa siempre modo producción para upload');
          
          return true;
        } else {
          console.log('   ❌ Upload falló:', uploadData.message);
        }
      } catch (e) {
        console.log('   ❌ Respuesta no es JSON válido');
        console.log('   📄 Respuesta:', uploadText.substring(0, 200));
      }
    } else {
      console.log('   ❌ Upload falló con status:', uploadResponse.status);
      console.log('   📄 Respuesta:', uploadText.substring(0, 200));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📋 Solución:');
    console.log('1. Detén el servidor actual');
    console.log('2. Ejecuta: start-production-backend.bat');
    console.log('3. Prueba de nuevo');
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
    console.log('Usando fetch nativo');
  }
}

testProductionUpload();
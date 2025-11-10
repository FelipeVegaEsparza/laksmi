// Test the BYPASS solution
async function testBypassSolution() {
  console.log('🎯 PROBANDO SOLUCIÓN BYPASS DEFINITIVA\n');
  
  // Wait for server restart
  console.log('⏳ Esperando reinicio del servidor...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  try {
    // Step 1: Check if bypass endpoint is registered
    console.log('1. 📋 Verificando endpoints...');
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
      console.log('   🔄 Esperando más tiempo...');
      
      // Wait more and try again
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const retryResponse = await fetch('http://localhost:3000/api/v1/');
      const retryData = await retryResponse.json();
      
      if (retryData.endpoints['upload-direct-bypass']) {
        console.log('   ✅ Ahora sí está registrado!');
      } else {
        console.log('   ❌ Aún no está registrado - problema crítico');
        return;
      }
    }
    
    // Step 2: Test upload
    console.log('\n2. 📤 Probando upload bypass...');
    
    const imageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const imageBuffer = Buffer.from(imageData, 'base64');
    
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    formData.append('images', blob, 'test-bypass.png');
    
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
          console.log('   🎉 ¡UPLOAD BYPASS EXITOSO!');
          console.log(`   📁 Archivos: ${uploadData.data.files.length}`);
          console.log(`   🔗 URLs: ${uploadData.data.urls.join(', ')}`);
          
          console.log('\n🎉 ¡SOLUCIÓN FUNCIONANDO! EL DASHBOARD DEBERÍA FUNCIONAR AHORA');
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
    console.error('❌ Error en prueba bypass:', error.message);
  }
  
  return false;
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

testBypassSolution();
// Test the WORKING solution
async function testWorkingSolution() {
  console.log('🎯 PROBANDO SOLUCIÓN DEFINITIVA\n');
  
  try {
    // Step 1: Check endpoints
    console.log('1. 📋 Verificando endpoints disponibles...');
    const endpointsResponse = await fetch('http://localhost:3000/api/v1/');
    const endpointsData = await endpointsResponse.json();
    
    console.log('   Endpoints disponibles:');
    Object.keys(endpointsData.endpoints).forEach(key => {
      console.log(`   - ${key}: ${endpointsData.endpoints[key]}`);
    });
    
    if (endpointsData.endpoints['upload-working']) {
      console.log('\n   ✅ upload-working está registrado!');
    } else {
      console.log('\n   ❌ upload-working NO está registrado');
      console.log('   🔄 Nodemon debe reiniciarse automáticamente');
      return;
    }
    
    // Step 2: Test upload
    console.log('\n2. 📤 Probando upload...');
    
    const imageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const imageBuffer = Buffer.from(imageData, 'base64');
    
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    formData.append('images', blob, 'test-working.png');
    
    const uploadResponse = await fetch('http://localhost:3000/api/v1/upload-working/services', {
      method: 'POST',
      body: formData
    });
    
    console.log(`   Status: ${uploadResponse.status}`);
    const uploadText = await uploadResponse.text();
    
    if (uploadResponse.status === 200) {
      try {
        const uploadData = JSON.parse(uploadText);
        if (uploadData.success) {
          console.log('   ✅ UPLOAD EXITOSO!');
          console.log(`   📁 Archivos: ${uploadData.data.files.length}`);
          console.log(`   🔗 URLs: ${uploadData.data.urls.join(', ')}`);
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
    
    // Step 3: Test list
    console.log('\n3. 📋 Probando listado...');
    
    const listResponse = await fetch('http://localhost:3000/api/v1/upload-working/services');
    const listText = await listResponse.text();
    
    if (listResponse.status === 200) {
      try {
        const listData = JSON.parse(listText);
        if (listData.success) {
          console.log('   ✅ LISTADO EXITOSO!');
          console.log(`   📁 Archivos encontrados: ${listData.data.length}`);
        } else {
          console.log('   ❌ Listado falló:', listData.message);
        }
      } catch (e) {
        console.log('   ❌ Respuesta de listado no es JSON válido');
        console.log('   📄 Respuesta:', listText.substring(0, 200));
      }
    } else {
      console.log('   ❌ Listado falló con status:', listResponse.status);
    }
    
    console.log('\n🎉 PRUEBA COMPLETADA');
    
  } catch (error) {
    console.error('❌ Error en prueba:', error.message);
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

testWorkingSolution();
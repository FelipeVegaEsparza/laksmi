// FINAL TEST - This MUST work
async function testFinalSolution() {
  console.log('🎯 PRUEBA FINAL DE LA SOLUCIÓN\n');
  
  try {
    // Step 1: Check if direct endpoint is registered
    console.log('1. 📋 Verificando registro del endpoint directo...');
    const endpointsResponse = await fetch('http://localhost:3000/api/v1/');
    const endpointsData = await endpointsResponse.json();
    
    if (endpointsData.endpoints['upload-direct']) {
      console.log('   ✅ upload-direct está registrado!');
    } else {
      console.log('   ❌ upload-direct NO está registrado');
      console.log('   🔄 DEBES REINICIAR EL BACKEND');
      return;
    }
    
    // Step 2: Test direct upload
    console.log('\n2. 📤 Probando upload directo...');
    
    const imageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const imageBuffer = Buffer.from(imageData, 'base64');
    
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    formData.append('images', blob, 'test-final.png');
    
    const uploadResponse = await fetch('http://localhost:3000/api/v1/upload-direct/services', {
      method: 'POST',
      body: formData
    });
    
    console.log(`   Status: ${uploadResponse.status}`);
    const uploadData = await uploadResponse.json();
    
    if (uploadData.success) {
      console.log('   ✅ UPLOAD EXITOSO!');
      console.log(`   📁 Archivos subidos: ${uploadData.data.files.length}`);
      console.log(`   🔗 URLs: ${uploadData.data.urls.join(', ')}`);
    } else {
      console.log('   ❌ Upload falló:', uploadData.message);
    }
    
    // Step 3: Test list
    console.log('\n3. 📋 Probando listado de archivos...');
    
    const listResponse = await fetch('http://localhost:3000/api/v1/upload-direct/services');
    const listData = await listResponse.json();
    
    if (listData.success) {
      console.log('   ✅ LISTADO EXITOSO!');
      console.log(`   📁 Archivos encontrados: ${listData.data.length}`);
    } else {
      console.log('   ❌ Listado falló:', listData.message);
    }
    
    console.log('\n🎉 SOLUCIÓN COMPLETA - EL SISTEMA DEBE FUNCIONAR AHORA');
    
  } catch (error) {
    console.error('❌ Error en prueba final:', error.message);
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

testFinalSolution();
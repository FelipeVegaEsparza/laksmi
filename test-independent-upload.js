// Test completely independent upload endpoint
async function testIndependentUpload() {
  console.log('🎯 PROBANDO ENDPOINT COMPLETAMENTE INDEPENDIENTE\n');
  
  try {
    console.log('📤 Probando endpoint /upload-now/services...');
    
    const imageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const imageBuffer = Buffer.from(imageData, 'base64');
    
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    formData.append('images', blob, 'test-independent.png');
    
    const uploadResponse = await fetch('http://localhost:3000/upload-now/services', {
      method: 'POST',
      body: formData
    });
    
    console.log(`Status: ${uploadResponse.status}`);
    const uploadText = await uploadResponse.text();
    console.log(`Response preview: ${uploadText.substring(0, 100)}...`);
    
    if (uploadResponse.status === 200) {
      try {
        const uploadData = JSON.parse(uploadText);
        if (uploadData.success) {
          console.log('\n🎉 ¡ENDPOINT INDEPENDIENTE FUNCIONA!');
          console.log(`📁 Archivos subidos: ${uploadData.data.files.length}`);
          console.log(`🔗 URLs: ${uploadData.data.urls.join(', ')}`);
          
          console.log('\n✅ SOLUCIÓN DEFINITIVA ENCONTRADA');
          console.log('🔧 Endpoint: /upload-now/:type');
          console.log('📋 El dashboard funcionará ahora');
          
          return true;
        } else {
          console.log('❌ Upload falló:', uploadData.message);
        }
      } catch (e) {
        console.log('❌ Respuesta no es JSON válido');
        console.log('📄 Respuesta completa:', uploadText);
      }
    } else {
      console.log('❌ Upload falló con status:', uploadResponse.status);
      console.log('📄 Respuesta completa:', uploadText);
    }
    
    // Also test GET
    console.log('\n📋 Probando GET /upload-now/services...');
    const getResponse = await fetch('http://localhost:3000/upload-now/services');
    console.log(`GET Status: ${getResponse.status}`);
    const getText = await getResponse.text();
    console.log(`GET Response: ${getText}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📋 Instrucciones:');
    console.log('1. Asegúrate de que el servidor esté corriendo');
    console.log('2. Verifica que se haya compilado: npm run build');
    console.log('3. Reinicia el servidor: npm run start');
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

testIndependentUpload();
// Test emergency upload endpoint
async function testEmergencyUpload() {
  console.log('🚨 PROBANDO ENDPOINT DE EMERGENCIA\n');
  
  try {
    console.log('📤 Probando endpoint de emergencia...');
    
    const imageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const imageBuffer = Buffer.from(imageData, 'base64');
    
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    formData.append('images', blob, 'test-emergency.png');
    
    const uploadResponse = await fetch('http://localhost:3000/api/v1/upload-emergency/services', {
      method: 'POST',
      body: formData
    });
    
    console.log(`Status: ${uploadResponse.status}`);
    const uploadText = await uploadResponse.text();
    
    if (uploadResponse.status === 200) {
      try {
        const uploadData = JSON.parse(uploadText);
        if (uploadData.success) {
          console.log('\n🎉 ¡ENDPOINT DE EMERGENCIA FUNCIONA!');
          console.log(`📁 Archivos subidos: ${uploadData.data.files.length}`);
          console.log(`🔗 URLs: ${uploadData.data.urls.join(', ')}`);
          
          console.log('\n✅ SOLUCIÓN FINAL CONFIRMADA');
          console.log('📋 El dashboard ahora funcionará correctamente');
          console.log('🔧 Endpoint usado: /api/v1/upload-emergency/:type');
          
          return true;
        } else {
          console.log('❌ Upload falló:', uploadData.message);
        }
      } catch (e) {
        console.log('❌ Respuesta no es JSON válido');
        console.log('📄 Respuesta:', uploadText.substring(0, 200));
      }
    } else {
      console.log('❌ Upload falló con status:', uploadResponse.status);
      console.log('📄 Respuesta:', uploadText.substring(0, 200));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📋 Instrucciones:');
    console.log('1. Detén el servidor backend');
    console.log('2. Ejecuta: npm run build');
    console.log('3. Ejecuta: npm run start');
    console.log('4. Prueba de nuevo');
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

testEmergencyUpload();
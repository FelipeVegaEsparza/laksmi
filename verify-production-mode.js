// Verify if server is running in production mode
async function verifyProductionMode() {
  console.log('🔍 VERIFICANDO MODO DEL SERVIDOR\n');
  
  try {
    // Test the independent endpoint
    console.log('1. 📤 Probando endpoint independiente...');
    
    const response = await fetch('http://localhost:3000/upload-now/services');
    console.log(`   Status: ${response.status}`);
    
    if (response.status === 404) {
      console.log('\n❌ SERVIDOR EN MODO DESARROLLO');
      console.log('📋 INSTRUCCIONES PARA CAMBIAR A PRODUCCIÓN:');
      console.log('   1. Ve a la terminal del backend');
      console.log('   2. Presiona Ctrl+C para detener');
      console.log('   3. Ejecuta: cd backend');
      console.log('   4. Ejecuta: npm run build');
      console.log('   5. Ejecuta: npm run start');
      console.log('   6. Espera "Server running on port 3000"');
      console.log('   7. Ejecuta este script de nuevo');
      return false;
    }
    
    if (response.status === 200) {
      const text = await response.text();
      
      if (text.includes('success')) {
        console.log('\n✅ SERVIDOR EN MODO PRODUCCIÓN');
        console.log('🎉 El endpoint independiente funciona');
        
        // Now test upload
        console.log('\n2. 📤 Probando upload...');
        
        const imageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        const imageBuffer = Buffer.from(imageData, 'base64');
        
        const formData = new FormData();
        const blob = new Blob([imageBuffer], { type: 'image/png' });
        formData.append('images', blob, 'test-verify.png');
        
        const uploadResponse = await fetch('http://localhost:3000/upload-now/services', {
          method: 'POST',
          body: formData
        });
        
        console.log(`   Upload Status: ${uploadResponse.status}`);
        const uploadText = await uploadResponse.text();
        
        if (uploadResponse.status === 200) {
          const uploadData = JSON.parse(uploadText);
          if (uploadData.success) {
            console.log('\n🎉 ¡UPLOAD FUNCIONA PERFECTAMENTE!');
            console.log(`   📁 Archivos: ${uploadData.data.files.length}`);
            console.log(`   🔗 URLs: ${uploadData.data.urls.join(', ')}`);
            
            console.log('\n✅ SISTEMA COMPLETAMENTE FUNCIONAL');
            console.log('📋 El dashboard ahora puede subir imágenes');
            return true;
          }
        }
        
        console.log(`   Upload response: ${uploadText}`);
      }
    }
    
  } catch (error) {
    console.log('\n❌ SERVIDOR NO RESPONDE');
    console.log('📋 SOLUCIÓN:');
    console.log('   1. Asegúrate de que el backend esté corriendo');
    console.log('   2. Usa: npm run start (NO npm run dev)');
    console.log(`   Error: ${error.message}`);
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

verifyProductionMode();
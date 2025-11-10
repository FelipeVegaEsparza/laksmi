// Test the endpoint directly to see what's happening
async function testDirectEndpoint() {
  console.log('🔍 PROBANDO ENDPOINT DIRECTO\n');
  
  try {
    // Test the bypass endpoint directly
    console.log('1. 📤 Probando endpoint bypass directamente...');
    
    const directResponse = await fetch('http://localhost:3000/api/v1/upload-direct-bypass/services', {
      method: 'GET'
    });
    
    console.log(`   Status: ${directResponse.status}`);
    const directText = await directResponse.text();
    console.log(`   Response: ${directText.substring(0, 200)}...`);
    
    if (directResponse.status === 200) {
      try {
        const directData = JSON.parse(directText);
        if (directData.success !== undefined) {
          console.log('   ✅ ¡ENDPOINT BYPASS FUNCIONA!');
          console.log('   📋 El endpoint existe pero no aparece en la lista');
          
          // Now test upload
          console.log('\n2. 📤 Probando upload en endpoint que funciona...');
          
          const imageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
          const imageBuffer = Buffer.from(imageData, 'base64');
          
          const formData = new FormData();
          const blob = new Blob([imageBuffer], { type: 'image/png' });
          formData.append('images', blob, 'test-direct.png');
          
          const uploadResponse = await fetch('http://localhost:3000/api/v1/upload-direct-bypass/services', {
            method: 'POST',
            body: formData
          });
          
          console.log(`   Upload Status: ${uploadResponse.status}`);
          const uploadText = await uploadResponse.text();
          
          if (uploadResponse.status === 200) {
            const uploadData = JSON.parse(uploadText);
            if (uploadData.success) {
              console.log('\n   🎉 ¡UPLOAD FUNCIONA PERFECTAMENTE!');
              console.log(`   📁 Archivos: ${uploadData.data.files.length}`);
              console.log(`   🔗 URLs: ${uploadData.data.urls.join(', ')}`);
              
              console.log('\n🎉 SOLUCIÓN ENCONTRADA:');
              console.log('✅ El endpoint /upload-direct-bypass/services FUNCIONA');
              console.log('✅ Solo no aparece en la lista de endpoints');
              console.log('✅ El dashboard debería funcionar ahora');
              
              return true;
            }
          }
          
          console.log(`   Upload response: ${uploadText.substring(0, 200)}`);
        }
      } catch (e) {
        console.log('   📄 Respuesta no es JSON, pero endpoint responde');
      }
    }
    
    // Test other variations
    console.log('\n3. 🔍 Probando variaciones del endpoint...');
    
    const variations = [
      '/api/v1/upload-direct-bypass/products',
      '/api/v1/upload-working/services',
      '/api/v1/upload-final/services',
      '/api/v1/upload-simple/services'
    ];
    
    for (const variation of variations) {
      try {
        const varResponse = await fetch(`http://localhost:3000${variation}`);
        console.log(`   ${variation}: ${varResponse.status}`);
        
        if (varResponse.status === 200) {
          const varText = await varResponse.text();
          if (!varText.includes('API del Sistema de Gestión')) {
            console.log(`   ✅ ${variation} FUNCIONA!`);
          }
        }
      } catch (e) {
        console.log(`   ${variation}: Error`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
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

testDirectEndpoint();
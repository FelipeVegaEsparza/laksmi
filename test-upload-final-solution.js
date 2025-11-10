// Test final para verificar que el upload funciona después de la corrección
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUpload() {
  console.log('🧪 Probando el endpoint de upload después de la corrección...');
  
  try {
    // Crear un archivo de prueba
    const testFile = path.join(__dirname, 'test-image.txt');
    fs.writeFileSync(testFile, 'Test image content for upload');
    
    const form = new FormData();
    form.append('images', fs.createReadStream(testFile), 'test-image.txt');
    
    const response = await fetch('http://localhost:3000/api/v1/upload-working/before', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    const result = await response.json();
    
    console.log('📊 Respuesta del servidor:');
    console.log('Status:', response.status);
    console.log('Resultado:', JSON.stringify(result, null, 2));
    
    if (response.status === 200 && result.success) {
      console.log('✅ ÉXITO: El upload funciona correctamente después de la corrección');
    } else {
      console.log('❌ ERROR: El upload aún no funciona');
    }
    
    // Limpiar archivo de prueba
    fs.unlinkSync(testFile);
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

testUpload();
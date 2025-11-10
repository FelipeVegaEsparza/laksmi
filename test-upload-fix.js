// Test definitivo del upload sin autenticación
const axios = require('axios');
const FormData = require('form-data');

async function testUploadDefinitivo() {
  try {
    console.log('🔍 PRUEBA DEFINITIVA DE UPLOAD SIN AUTENTICACIÓN\n');
    
    // Test del endpoint simple SIN autenticación
    console.log('📤 Probando endpoint simple /upload-simple/services...');
    
    const formData = new FormData();
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    
    formData.append('images', testImageBuffer, {
      filename: 'test.png',
      contentType: 'image/png'
    });
    
    const uploadResponse = await axios.post(
      'http://localhost:3000/api/v1/upload-simple/services',
      formData,
      {
        headers: formData.getHeaders()
      }
    );
    
    console.log('✅ UPLOAD EXITOSO!');
    console.log('📋 Respuesta:', JSON.stringify(uploadResponse.data, null, 2));
    
    // Test GET del endpoint simple
    console.log('\n📋 Probando GET /upload-simple/services...');
    
    const getResponse = await axios.get('http://localhost:3000/api/v1/upload-simple/services');
    
    console.log('✅ GET EXITOSO!');
    console.log('📋 Archivos:', JSON.stringify(getResponse.data, null, 2));
    
    console.log('\n🎉 TODAS LAS PRUEBAS PASARON - EL UPLOAD FUNCIONA!');
    
  } catch (error) {
    console.error('❌ ERROR EN LA PRUEBA:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
    console.error('Full response:', error.response?.data);
  }
}

testUploadDefinitivo();
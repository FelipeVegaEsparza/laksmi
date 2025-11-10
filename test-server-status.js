// Test rápido para verificar el estado del servidor
const http = require('http');

console.log('🔍 Verificando estado del servidor...');

// Test 1: Health check
const healthOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/health',
  method: 'GET'
};

const healthReq = http.request(healthOptions, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('✅ Health check:', res.statusCode, data);
    
    // Test 2: Upload endpoint
    testUploadEndpoint();
  });
});

healthReq.on('error', (error) => {
  console.error('❌ Servidor no está corriendo:', error.message);
  console.log('💡 Ejecuta: cd backend && npm run dev');
});

healthReq.end();

function testUploadEndpoint() {
  console.log('🧪 Probando endpoint de upload...');
  
  const uploadOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/upload-working/services',
    method: 'GET'
  };
  
  const uploadReq = http.request(uploadOptions, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📊 Upload endpoint:', res.statusCode);
      if (res.statusCode === 200) {
        console.log('✅ Upload endpoint disponible');
      } else {
        console.log('❌ Upload endpoint con problemas');
      }
      console.log('Respuesta:', data);
    });
  });
  
  uploadReq.on('error', (error) => {
    console.error('❌ Error en upload endpoint:', error.message);
  });
  
  uploadReq.end();
}
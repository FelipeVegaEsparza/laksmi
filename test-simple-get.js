// Test simple para verificar que el servidor responde
const http = require('http');

function testServer() {
  console.log('🧪 Probando conectividad básica del servidor...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/health',
    method: 'GET'
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📊 Respuesta del health check:');
      console.log('Status:', res.statusCode);
      console.log('Resultado:', data);
      
      if (res.statusCode === 200) {
        console.log('✅ ÉXITO: El servidor responde correctamente');
        
        // Ahora probar el endpoint de upload
        testUploadEndpoint();
      } else {
        console.log('❌ ERROR: El servidor no responde correctamente');
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Error de conexión:', error.message);
  });
  
  req.end();
}

function testUploadEndpoint() {
  console.log('🧪 Probando endpoint de upload...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/upload-working/before',
    method: 'GET'
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📊 Respuesta del endpoint upload:');
      console.log('Status:', res.statusCode);
      console.log('Resultado:', data);
      
      if (res.statusCode === 200) {
        console.log('✅ ÉXITO: El endpoint de upload está disponible');
      } else if (res.statusCode === 404) {
        console.log('❌ ERROR: El endpoint de upload no se encuentra (404)');
      } else {
        console.log('⚠️  ADVERTENCIA: Respuesta inesperada del endpoint');
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Error de conexión:', error.message);
  });
  
  req.end();
}

testServer();
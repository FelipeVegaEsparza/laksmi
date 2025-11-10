// Test para verificar que la corrección de CORS funciona
const http = require('http');

console.log('🧪 Probando corrección de CORS para imágenes...');

const imagePath = '/uploads/services/images-1760841769319-567190668.jpg';

console.log('🔍 Probando imagen con headers corregidos...');

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: imagePath,
  method: 'GET'
}, (res) => {
  console.log('📊 Status:', res.statusCode);
  console.log('📊 Headers CORS importantes:');
  
  const corsHeaders = [
    'access-control-allow-origin',
    'cross-origin-resource-policy',
    'cross-origin-embedder-policy',
    'cache-control'
  ];
  
  corsHeaders.forEach(header => {
    const value = res.headers[header];
    const status = value ? '✅' : '❌';
    console.log(`  ${status} ${header}: ${value || 'NO PRESENTE'}`);
  });
  
  if (res.statusCode === 200) {
    console.log('\n✅ Imagen accesible con headers corregidos');
    
    // Verificar que los headers son correctos
    const corsOrigin = res.headers['access-control-allow-origin'];
    const resourcePolicy = res.headers['cross-origin-resource-policy'];
    
    if (corsOrigin === '*' && resourcePolicy === 'cross-origin') {
      console.log('✅ Headers CORS correctos para frontend');
    } else {
      console.log('⚠️ Headers CORS pueden necesitar ajustes');
    }
  } else {
    console.log('❌ Imagen no accesible');
  }
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.end();
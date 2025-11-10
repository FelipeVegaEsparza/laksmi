// Test para verificar por qué las imágenes no cargan
const http = require('http');

console.log('🧪 Probando carga de imágenes...');

// Imagen específica del error
const imagePath = '/uploads/services/images-1760841769319-567190668.jpg';
const imageUrl = `http://localhost:3000${imagePath}`;

console.log('🔍 Probando imagen:', imageUrl);

// Test 1: Verificar si la imagen existe en el servidor
const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: imagePath,
  method: 'GET'
}, (res) => {
  console.log('📊 Status de imagen:', res.statusCode);
  console.log('📊 Headers de respuesta:');
  
  Object.keys(res.headers).forEach(key => {
    console.log(`  ${key}: ${res.headers[key]}`);
  });
  
  if (res.statusCode === 200) {
    console.log('✅ Imagen existe y es accesible');
    
    let dataLength = 0;
    res.on('data', (chunk) => {
      dataLength += chunk.length;
    });
    
    res.on('end', () => {
      console.log(`📊 Tamaño de imagen: ${dataLength} bytes`);
    });
  } else if (res.statusCode === 404) {
    console.log('❌ Imagen no encontrada en el servidor');
    
    // Listar imágenes disponibles
    listAvailableImages();
  } else {
    console.log('⚠️ Status inesperado:', res.statusCode);
  }
});

req.on('error', (error) => {
  console.error('❌ Error accediendo imagen:', error.message);
});

req.end();

function listAvailableImages() {
  console.log('\n📋 Listando imágenes disponibles...');
  
  const listReq = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/upload/services',
    method: 'GET'
  }, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        try {
          const response = JSON.parse(data);
          if (response.success && response.data.length > 0) {
            console.log('📋 Imágenes disponibles:');
            response.data.forEach((img, index) => {
              console.log(`  ${index + 1}. ${img.filename}`);
              console.log(`     URL: ${img.url}`);
              console.log(`     Tamaño: ${img.size} bytes`);
              console.log('     ---');
            });
          } else {
            console.log('📭 No hay imágenes disponibles');
          }
        } catch (error) {
          console.log('❌ Error parsing response:', error.message);
        }
      } else {
        console.log('❌ Error listando imágenes:', res.statusCode, data);
      }
    });
  });
  
  listReq.on('error', (error) => {
    console.error('❌ Error listando imágenes:', error.message);
  });
  
  listReq.end();
}
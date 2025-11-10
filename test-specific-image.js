// Test para verificar la imagen específica que está fallando
const http = require('http');

console.log('🧪 Probando imagen específica que falla...');

const imagePath = '/uploads/services/images-1760842742136-904827147.jpg';
const imageUrl = `http://localhost:3000${imagePath}`;

console.log('🔍 Probando:', imageUrl);

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: imagePath,
  method: 'GET'
}, (res) => {
  console.log('📊 Status:', res.statusCode);
  console.log('📊 Content-Type:', res.headers['content-type']);
  console.log('📊 Content-Length:', res.headers['content-length']);
  
  // Headers CORS importantes
  console.log('📊 CORS Headers:');
  console.log('  Access-Control-Allow-Origin:', res.headers['access-control-allow-origin']);
  console.log('  Cross-Origin-Resource-Policy:', res.headers['cross-origin-resource-policy']);
  
  if (res.statusCode === 200) {
    console.log('✅ Imagen existe y es accesible desde servidor');
    
    let size = 0;
    res.on('data', (chunk) => {
      size += chunk.length;
    });
    
    res.on('end', () => {
      console.log(`📊 Tamaño real: ${size} bytes`);
      
      if (size > 0) {
        console.log('✅ Imagen tiene contenido válido');
      } else {
        console.log('❌ Imagen está vacía');
      }
    });
    
  } else if (res.statusCode === 404) {
    console.log('❌ Imagen no encontrada en servidor');
    
    // Listar imágenes disponibles
    listAvailableImages();
  } else {
    console.log('⚠️ Status inesperado:', res.statusCode);
  }
});

req.on('error', (error) => {
  console.error('❌ Error de conexión:', error.message);
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
              
              // Verificar si es la imagen que estamos buscando
              if (img.filename === 'images-1760842742136-904827147.jpg') {
                console.log('     ✅ Esta es la imagen que estamos probando');
              }
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
  
  listReq.end();
}
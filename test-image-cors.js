// Test específico para verificar CORS de imágenes
const http = require('http');

console.log('🖼️ Probando CORS de imágenes...');

// Primero verificar que hay imágenes subidas
const listOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/upload-working/services',
  method: 'GET'
};

const listReq = http.request(listOptions, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📋 Lista de imágenes:', res.statusCode);
    
    if (res.statusCode === 200) {
      try {
        const response = JSON.parse(data);
        if (response.success && response.data.length > 0) {
          const firstImage = response.data[0];
          console.log('🖼️ Primera imagen encontrada:', firstImage.filename);
          
          // Probar acceso directo a la imagen
          testImageAccess(firstImage.url);
        } else {
          console.log('📭 No hay imágenes subidas para probar');
        }
      } catch (error) {
        console.error('❌ Error parsing response:', error.message);
      }
    } else {
      console.log('❌ Error obteniendo lista:', data);
    }
  });
});

listReq.on('error', (error) => {
  console.error('❌ Error de conexión:', error.message);
});

listReq.end();

function testImageAccess(imageUrl) {
  console.log('🧪 Probando acceso a imagen:', imageUrl);
  
  const imageOptions = {
    hostname: 'localhost',
    port: 3000,
    path: imageUrl,
    method: 'GET'
  };
  
  const imageReq = http.request(imageOptions, (res) => {
    console.log('📊 Status de imagen:', res.statusCode);
    console.log('📊 Headers de imagen:');
    
    // Verificar headers CORS específicos
    const corsHeaders = [
      'access-control-allow-origin',
      'cross-origin-resource-policy',
      'cross-origin-embedder-policy'
    ];
    
    corsHeaders.forEach(header => {
      if (res.headers[header]) {
        console.log(`  ✅ ${header}: ${res.headers[header]}`);
      } else {
        console.log(`  ❌ ${header}: NO PRESENTE`);
      }
    });
    
    if (res.statusCode === 200) {
      console.log('✅ Imagen accesible desde servidor');
      
      if (res.headers['access-control-allow-origin']) {
        console.log('✅ Headers CORS presentes - debería funcionar en frontend');
      } else {
        console.log('❌ Headers CORS faltantes - problema de CORS confirmado');
      }
    } else {
      console.log('❌ Imagen no accesible');
    }
  });
  
  imageReq.on('error', (error) => {
    console.error('❌ Error accediendo imagen:', error.message);
  });
  
  imageReq.end();
}
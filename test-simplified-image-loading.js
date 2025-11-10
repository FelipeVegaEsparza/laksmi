// Test para verificar que las imágenes cargan con la configuración simplificada
const http = require('http');

console.log('🧪 Probando carga simplificada de imágenes...');

// Probar las imágenes específicas que están fallando
const testImages = [
  '/uploads/services/images-1760841769319-567190668.jpg',
  '/uploads/services/images-1760842212804-237079016.png'
];

testImages.forEach((imagePath, index) => {
  setTimeout(() => {
    console.log(`\n🔍 Test ${index + 1}: ${imagePath}`);
    
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: imagePath,
      method: 'GET'
    }, (res) => {
      console.log(`📊 Status: ${res.statusCode}`);
      
      if (res.statusCode === 200) {
        console.log('✅ Imagen accesible desde servidor');
        
        // Verificar headers importantes
        const corsOrigin = res.headers['access-control-allow-origin'];
        const resourcePolicy = res.headers['cross-origin-resource-policy'];
        
        console.log(`📊 CORS Origin: ${corsOrigin}`);
        console.log(`📊 Resource Policy: ${resourcePolicy}`);
        
        if (corsOrigin === '*' && resourcePolicy === 'cross-origin') {
          console.log('✅ Headers CORS correctos');
        } else {
          console.log('⚠️ Headers CORS pueden causar problemas');
        }
        
        let size = 0;
        res.on('data', (chunk) => {
          size += chunk.length;
        });
        
        res.on('end', () => {
          console.log(`📊 Tamaño: ${size} bytes`);
        });
        
      } else if (res.statusCode === 404) {
        console.log('❌ Imagen no encontrada');
      } else {
        console.log(`⚠️ Status inesperado: ${res.statusCode}`);
      }
    });
    
    req.on('error', (error) => {
      console.error(`❌ Error: ${error.message}`);
    });
    
    req.end();
  }, index * 1000);
});

// También probar el endpoint de listado
setTimeout(() => {
  console.log('\n📋 Probando endpoint de listado...');
  
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
      console.log(`📊 List Status: ${res.statusCode}`);
      
      if (res.statusCode === 200) {
        try {
          const response = JSON.parse(data);
          if (response.success) {
            console.log(`✅ ${response.data.length} imágenes listadas`);
            
            response.data.forEach((img, index) => {
              console.log(`  ${index + 1}. ${img.filename} (${img.size} bytes)`);
            });
          } else {
            console.log('❌ Response no exitosa:', response);
          }
        } catch (error) {
          console.log('❌ Error parsing response:', error.message);
        }
      } else {
        console.log('❌ Error en listado:', data);
      }
    });
  });
  
  listReq.end();
}, 3000);
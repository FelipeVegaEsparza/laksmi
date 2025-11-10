// Test para verificar que las imágenes cargan sin cache busting
const http = require('http');

console.log('🧪 Probando imágenes sin cache busting...');

// URLs sin parámetros ?t=
const testUrls = [
  'http://localhost:3000/uploads/services/images-1760841769319-567190668.jpg',
  'http://localhost:3000/uploads/services/images-1760842212804-237079016.png'
];

testUrls.forEach((url, index) => {
  setTimeout(() => {
    console.log(`\n🔍 Test ${index + 1}: ${url}`);
    
    const urlObj = new URL(url);
    
    const req = http.request({
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'GET'
    }, (res) => {
      console.log(`📊 Status: ${res.statusCode}`);
      
      if (res.statusCode === 200) {
        console.log('✅ Imagen carga correctamente sin cache busting');
        
        let size = 0;
        res.on('data', (chunk) => {
          size += chunk.length;
        });
        
        res.on('end', () => {
          console.log(`📊 Tamaño: ${size} bytes`);
        });
        
      } else {
        console.log('❌ Error:', res.statusCode);
      }
    });
    
    req.on('error', (error) => {
      console.error(`❌ Error: ${error.message}`);
    });
    
    req.end();
  }, index * 1000);
});

// Simular lo que hace getImageUrl ahora
console.log('\n🔧 Simulando getImageUrl corregido:');

function getImageUrl(path) {
  if (path.startsWith('http')) {
    return path;
  }

  const baseUrl = 'http://localhost:3000';
  const fullUrl = `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  
  // Sin cache busting
  return fullUrl;
}

const testPaths = [
  '/uploads/services/images-1760841769319-567190668.jpg',
  'uploads/services/images-1760842212804-237079016.png'
];

testPaths.forEach(path => {
  const url = getImageUrl(path);
  console.log(`  ${path} → ${url}`);
});
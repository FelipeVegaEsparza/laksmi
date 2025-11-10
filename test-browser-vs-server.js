// Test para comparar acceso desde servidor vs navegador
const http = require('http');

console.log('🧪 Investigando diferencia entre servidor y navegador...');

const imagePath = '/uploads/services/images-1760842742136-904827147.jpg';
const imageUrl = `http://localhost:3000${imagePath}`;

console.log('🔍 Probando desde Node.js (simula servidor)...');

// Test 1: Acceso desde Node.js (como servidor)
const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: imagePath,
  method: 'GET',
  headers: {
    'User-Agent': 'Node.js Test Client',
    'Accept': 'image/*'
  }
}, (res) => {
  console.log('📊 Desde Node.js:');
  console.log('  Status:', res.statusCode);
  console.log('  Content-Type:', res.headers['content-type']);
  console.log('  Content-Length:', res.headers['content-length']);
  
  // Headers que podrían afectar al navegador
  console.log('📊 Headers de seguridad:');
  console.log('  Content-Security-Policy:', res.headers['content-security-policy']);
  console.log('  X-Frame-Options:', res.headers['x-frame-options']);
  console.log('  X-Content-Type-Options:', res.headers['x-content-type-options']);
  
  console.log('📊 Headers CORS:');
  console.log('  Access-Control-Allow-Origin:', res.headers['access-control-allow-origin']);
  console.log('  Cross-Origin-Resource-Policy:', res.headers['cross-origin-resource-policy']);
  console.log('  Cross-Origin-Embedder-Policy:', res.headers['cross-origin-embedder-policy']);
  
  if (res.statusCode === 200) {
    console.log('✅ Accesible desde Node.js');
    
    // Verificar si hay contenido
    let hasContent = false;
    res.on('data', (chunk) => {
      if (chunk.length > 0) {
        hasContent = true;
      }
    });
    
    res.on('end', () => {
      if (hasContent) {
        console.log('✅ Imagen tiene contenido válido');
      } else {
        console.log('❌ Imagen está vacía');
      }
      
      // Ahora simular request como navegador
      testAsBrowser();
    });
  } else {
    console.log('❌ No accesible desde Node.js');
  }
});

req.on('error', (error) => {
  console.error('❌ Error desde Node.js:', error.message);
});

req.end();

function testAsBrowser() {
  console.log('\n🌐 Probando como navegador...');
  
  // Simular headers de navegador
  const browserReq = http.request({
    hostname: 'localhost',
    port: 3000,
    path: imagePath,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'image',
      'Sec-Fetch-Mode': 'no-cors',
      'Sec-Fetch-Site': 'same-origin',
      'Referer': 'http://localhost:5173/'
    }
  }, (res) => {
    console.log('📊 Como navegador:');
    console.log('  Status:', res.statusCode);
    console.log('  Content-Type:', res.headers['content-type']);
    
    if (res.statusCode === 200) {
      console.log('✅ Accesible como navegador');
    } else {
      console.log('❌ No accesible como navegador');
      console.log('  Posible causa: Headers de seguridad bloqueando navegador');
    }
    
    // Verificar headers problemáticos
    checkProblematicHeaders(res.headers);
  });
  
  browserReq.on('error', (error) => {
    console.error('❌ Error como navegador:', error.message);
  });
  
  browserReq.end();
}

function checkProblematicHeaders(headers) {
  console.log('\n🔍 Analizando headers problemáticos:');
  
  const problematicHeaders = {
    'content-security-policy': 'Puede bloquear carga de imágenes',
    'x-frame-options': 'Puede afectar embedding',
    'x-content-type-options': 'nosniff puede ser muy estricto',
    'cross-origin-resource-policy': 'Debe ser cross-origin para funcionar',
    'cross-origin-embedder-policy': 'Debe permitir cross-origin'
  };
  
  Object.keys(problematicHeaders).forEach(header => {
    const value = headers[header];
    if (value) {
      console.log(`  ⚠️  ${header}: ${value}`);
      console.log(`     ${problematicHeaders[header]}`);
    } else {
      console.log(`  ✅ ${header}: No presente`);
    }
  });
  
  // Verificar CSP específicamente
  const csp = headers['content-security-policy'];
  if (csp && csp.includes('img-src')) {
    console.log('\n🚨 Content-Security-Policy contiene img-src:');
    console.log('  Esto puede estar bloqueando la carga de imágenes');
    console.log('  CSP:', csp);
  }
}
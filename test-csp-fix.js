// Test para verificar que la corrección del CSP funciona
const http = require('http');

console.log('🧪 Probando corrección del Content-Security-Policy...');

const imagePath = '/uploads/services/images-1760842742136-904827147.jpg';

console.log('🔍 Probando imagen después de corrección CSP...');

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: imagePath,
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'image/*',
    'Referer': 'http://localhost:5173/'
  }
}, (res) => {
  console.log('📊 Status:', res.statusCode);
  console.log('📊 Content-Type:', res.headers['content-type']);
  
  // Verificar CSP corregido
  const csp = res.headers['content-security-policy'];
  console.log('\n📊 Content-Security-Policy:');
  console.log(csp);
  
  // Verificar si incluye http:
  if (csp && csp.includes('http:')) {
    console.log('✅ CSP incluye http: - debería permitir imágenes localhost');
  } else {
    console.log('❌ CSP no incluye http: - seguirá bloqueando');
  }
  
  // Verificar img-src específicamente
  const imgSrcMatch = csp.match(/img-src ([^;]+)/);
  if (imgSrcMatch) {
    console.log('\n📊 img-src específico:', imgSrcMatch[1]);
    
    if (imgSrcMatch[1].includes('http:')) {
      console.log('✅ img-src permite http:');
    } else {
      console.log('❌ img-src NO permite http:');
    }
  }
  
  if (res.statusCode === 200) {
    console.log('\n✅ Imagen accesible - CSP corregido debería funcionar en navegador');
  } else {
    console.log('\n❌ Imagen no accesible');
  }
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.end();
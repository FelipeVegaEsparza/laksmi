// Debug del error 400 en servicios
const http = require('http');

console.log('🔍 Debuggeando error 400 en servicios...');

// Test del endpoint que está fallando según el log
const serviceId = 'c7be75ac-ac49-11f0-934e-0045e287f432';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: `/api/v1/services/${serviceId}`,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📊 Status:', res.statusCode);
    console.log('📊 Headers:', res.headers);
    console.log('📊 Response:', data);
    
    if (res.statusCode === 400) {
      console.log('❌ Error 400 confirmado - probablemente falta autenticación');
    } else if (res.statusCode === 401) {
      console.log('❌ Error 401 - falta token de autenticación');
    } else if (res.statusCode === 200) {
      console.log('✅ Endpoint funciona correctamente');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error de conexión:', error.message);
});

req.end();
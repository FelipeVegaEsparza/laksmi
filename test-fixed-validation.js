// Test para verificar que la validación corregida funciona
const http = require('http');

console.log('🧪 Probando validación corregida de servicios...');

// Login primero
const loginData = JSON.stringify({
  username: 'admin',
  password: 'admin123'
});

const loginReq = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(loginData)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      const response = JSON.parse(data);
      const token = response.data.accessToken;
      console.log('✅ Token obtenido');
      
      // Probar diferentes formatos de URL
      testDifferentFormats(token);
    } else {
      console.log('❌ Login falló:', res.statusCode, data);
    }
  });
});

loginReq.write(loginData);
loginReq.end();

function testDifferentFormats(token) {
  const serviceId = 'c7be75ac-ac49-11f0-934e-0045e287f432';
  
  const testCases = [
    {
      name: 'Sin imágenes',
      images: []
    },
    {
      name: 'URL relativa (/uploads/...)',
      images: ['/uploads/services/images-1760840060283-456103291.png']
    },
    {
      name: 'URL completa HTTP',
      images: ['http://localhost:3000/uploads/services/images-1760840060283-456103291.png']
    },
    {
      name: 'Múltiples imágenes',
      images: [
        '/uploads/services/images-1760840060283-456103291.png',
        'http://localhost:3000/uploads/services/another-image.jpg'
      ]
    }
  ];
  
  testCases.forEach((testCase, index) => {
    setTimeout(() => {
      console.log(`\n🧪 Test ${index + 1}: ${testCase.name}`);
      
      const serviceData = JSON.stringify({
        name: 'Servicio de prueba',
        category: 'Corporal',
        price: 10,
        duration: 60,
        description: 'bla bla bla bla bla bl',
        images: testCase.images,
        requirements: [],
        isActive: true
      });
      
      console.log(`📤 Enviando imágenes: ${JSON.stringify(testCase.images)}`);
      
      const req = http.request({
        hostname: 'localhost',
        port: 3000,
        path: `/api/v1/services/${serviceId}`,
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(serviceData)
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const status = res.statusCode === 200 ? '✅' : '❌';
          console.log(`  ${status} Status: ${res.statusCode}`);
          
          if (res.statusCode !== 200) {
            try {
              const error = JSON.parse(data);
              console.log(`  Error: ${error.details || error.error}`);
            } catch (e) {
              console.log(`  Raw error: ${data}`);
            }
          } else {
            console.log('  ✅ PUT exitoso!');
          }
        });
      });
      
      req.on('error', (error) => {
        console.log(`  ❌ Request error: ${error.message}`);
      });
      
      req.write(serviceData);
      req.end();
    }, index * 1500); // Espaciar las requests
  });
}
// Test para entender qué URLs acepta Joi.string().uri()
const Joi = require('joi');

console.log('🧪 Probando validación Joi.string().uri()...');

const schema = Joi.array().items(Joi.string().uri());

const testUrls = [
  'http://localhost:3000/uploads/services/images-1760840060283-456103291.png',
  'https://localhost:3000/uploads/services/images-1760840060283-456103291.png',
  'http://example.com/image.png',
  'https://example.com/image.png',
  '/uploads/services/images-1760840060283-456103291.png',
  'uploads/services/images-1760840060283-456103291.png',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  ''
];

console.log('🔍 Probando URLs con Joi.string().uri():');

testUrls.forEach(url => {
  const result = schema.validate([url]);
  const status = result.error ? '❌' : '✅';
  const error = result.error ? result.error.details[0].message : 'OK';
  console.log(`  ${status} "${url}" → ${error}`);
});

// Probar con el backend real
console.log('\n🧪 Probando con backend real...');
testWithBackend();

function testWithBackend() {
  const http = require('http');
  
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
        
        // Probar diferentes formatos de URL
        testDifferentUrlFormats(token);
      }
    });
  });

  loginReq.write(loginData);
  loginReq.end();
}

function testDifferentUrlFormats(token) {
  const serviceId = 'c7be75ac-ac49-11f0-934e-0045e287f432';
  
  const testCases = [
    {
      name: 'Sin imágenes',
      images: []
    },
    {
      name: 'URL completa HTTP',
      images: ['http://localhost:3000/uploads/services/images-1760840060283-456103291.png']
    },
    {
      name: 'URL completa HTTPS',
      images: ['https://example.com/image.png']
    },
    {
      name: 'URL relativa',
      images: ['/uploads/services/images-1760840060283-456103291.png']
    }
  ];
  
  testCases.forEach((testCase, index) => {
    setTimeout(() => {
      console.log(`\n🧪 Test ${index + 1}: ${testCase.name}`);
      
      const serviceData = JSON.stringify({
        name: `Test ${testCase.name}`,
        category: 'Facial',
        price: 50,
        duration: 60,
        description: 'Test description',
        images: testCase.images,
        requirements: [],
        isActive: true
      });
      
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
          }
        });
      });
      
      req.write(serviceData);
      req.end();
    }, index * 1000); // Espaciar las requests
  });
}
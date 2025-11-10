// Simular exactamente lo que hace el frontend
const http = require('http');

console.log('🔍 Simulando request del frontend...');

// Primero hacer login como lo hace el frontend
const loginData = JSON.stringify({
  username: 'admin',
  password: 'admin123'
});

const loginOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(loginData)
  }
};

const loginReq = http.request(loginOptions, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      const response = JSON.parse(data);
      const token = response.data.accessToken;
      console.log('✅ Login exitoso');
      
      // Simular datos como los envía el frontend
      testFrontendLikeService(token);
      
    } else {
      console.log('❌ Login falló:', res.statusCode, data);
    }
  });
});

loginReq.write(loginData);
loginReq.end();

function testFrontendLikeService(token) {
  console.log('🧪 Simulando creación de servicio como frontend...');
  
  // Datos típicos que enviaría el frontend (incluyendo campos vacíos/undefined)
  const frontendData = {
    name: 'Mi Servicio Frontend Test',
    category: 'Facial',
    price: 75,
    duration: 60,
    description: 'Descripción de prueba desde frontend',
    images: [], // Array vacío como envía el frontend
    requirements: [], // Array vacío
    isActive: true
  };
  
  console.log('📤 Datos simulando frontend:', JSON.stringify(frontendData, null, 2));
  
  const serviceData = JSON.stringify(frontendData);
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/services',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(serviceData)
    }
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📊 Status:', res.statusCode);
      console.log('📊 Response:', data);
      
      if (res.statusCode === 400) {
        console.log('❌ Error 400 - Datos inválidos');
        try {
          const errorResponse = JSON.parse(data);
          console.log('🔍 Detalles específicos del error:');
          console.log(JSON.stringify(errorResponse, null, 2));
        } catch (e) {
          console.log('🔍 Raw error response:', data);
        }
      } else if (res.statusCode === 201) {
        console.log('✅ Servicio creado exitosamente');
      } else {
        console.log('⚠️ Status inesperado');
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Error de conexión:', error.message);
  });
  
  req.write(serviceData);
  req.end();
}

// También probar con datos problemáticos que podrían venir del frontend
function testProblematicData(token) {
  console.log('🧪 Probando datos problemáticos...');
  
  const problematicData = {
    name: '', // Nombre vacío
    category: '',
    price: 0,
    duration: 0,
    description: '',
    images: null, // null en lugar de array
    requirements: undefined, // undefined
    isActive: undefined
  };
  
  console.log('📤 Datos problemáticos:', JSON.stringify(problematicData, null, 2));
  
  // ... resto del código similar
}